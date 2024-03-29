const fs = require('fs');
const path = require('path');
const { MongoClient, Long } = require('mongodb');
const Utils = require("../Utils/helpers");

const {convertObjectToArray} = require("ioredis/built/utils");
const chConfig = {
    host: 'http://148.113.17.15:8123',
    database: 'mainnet',
    password: 'aMIDGxeb5WNO3uDuZGCbJb9TZMXg'
};
const DbProxy  = require('./src/dbproxy');
const CHProxy = require('../CHProxy')

class Indexer {


     processTransaction(tx, block) {
        // Convert hex fields to decimal and add metadata for each transaction
         let txInfo = {};
        txInfo.hash = tx.hash;
        txInfo.block_hash = tx.blockHash;
        txInfo.block_number = block.block_number;
        txInfo.from = tx.from;
        txInfo.to = tx.to;
        txInfo.gas = Utils.Int(tx.gas);
        txInfo.gas_price = Utils.Int(tx.gasPrice);
        txInfo.nonce = Utils.Int(tx.nonce);
        txInfo.calldata_size = Utils.HexToBytes(tx.input);
        txInfo.timestamp = block.timestamp;
        txInfo.time = block.time;
        txInfo.value = parseFloat(Utils.FormatValue(tx.value));
        txInfo.input = tx.input;
        //txInfo.meta = block.meta.time;
        txInfo.method_id = Utils.MethodID(tx.input);
        Object.assign(txInfo, Utils.TimeMeta(txInfo.timestamp));
        return txInfo;
    }

    processTransactions(txs, block) {
        let transactionsInfo = [];
        //console.log(txs);
        for (let tx of txs) {
            let processedTx = this.processTransaction(tx, block);
            transactionsInfo.push(processedTx);
        }
        return transactionsInfo;
    }

    processFullBlockEntry(entry) {
         let blockInfo = {};
        blockInfo.block_number = Utils.Int(entry.number);
        blockInfo.hash = entry.hash;
        blockInfo.transactions_count = entry.transactions.length;
        blockInfo.base_fee_per_gas = Utils.Int(entry.baseFeePerGas);
        blockInfo.gas_limit = Utils.Int(entry.gasLimit);
        blockInfo.gas_used = Utils.Int(entry.gasUsed);
        blockInfo.size = Utils.Int(entry.size);
        blockInfo.timestamp = Utils.Int(entry.timestamp);
        blockInfo.time = Utils.TruncDateUTC(entry.timestamp)


        Object.assign(blockInfo, Utils.TimeMeta(blockInfo.timestamp));
        Object.assign(blockInfo, Utils.TxsMeta(entry.transactions));
        Object.assign(blockInfo, Utils.WithdrawalsMeta(entry.withdrawals));

        let txInfo = [];
        if (entry.transactions && Array.isArray(entry.transactions) && entry.transactions.length > 0) {
            txInfo = this.processTransactions(entry.transactions, blockInfo);
        }

        if(txInfo.length > 0) {
            //console.log(txInfo)
        }

        return {
            blockInfo: blockInfo,
            txInfo: txInfo
        }
    }
    async readAndProcessLogs(filePath) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const logs = JSON.parse(fileContent);
        let logInfo = [];
        for(let log of logs) {
            logInfo.push(Utils.processLogEntry(log));
        }
        return logInfo;
    }
    async readAndProcessEntries(blockFile) {
        const blockFileContent = fs.readFileSync(blockFile, 'utf-8');
        const blocks = JSON.parse(blockFileContent);

        let blockInfo = [];
        let txInfo = [];
        for (let block of blocks) {
            let res = this.processFullBlockEntry(block);
            blockInfo.push(res.blockInfo);
            if(res.txInfo.length > 0) {
                // iterate over res.txInfo and add elements to txInfo
                for(let tx of res.txInfo) {
                    txInfo.push(tx);
                }
            }
        }

        return [ blockInfo, txInfo];
        //return blocks.map(this.processFullBlockEntry);
    }

    constructor() {
        this.blockDataDir = path.join('/home/tx/archive', 'blocks-tx-archive')
        this.mongoClient = new MongoClient('mongodb://localhost:27017');
        this.mysqlClient = new DbProxy(connectionConfig);
        this.chClient = new CHProxy(chConfig);
    }
    async setup() {
        // Create indexes
        await this.init();
        try {
            await this.blocksCollection.createIndex({ number: 1 }, { unique: true });
            await this.transactionsCollection.createIndex({ hash: 1 }, { unique: true });
            await this.logsCollection.createIndex({ transactionHash: 1, logIndex: 1 }, { unique: true });
            await this.logsCollection.createIndex({ address: 1 });
            await this.logsCollection.createIndex({ topicID: 1 });
        } catch (err) {
            console.error('Error creating indexes:', err);
            process.exit(1);
        }

    }
    async init() {
        try {
            await this.mongoClient.connect();
            this.db = this.mongoClient.db('mainnet');
            // drop collections if they exist
            await this.db.dropCollection('blocks');
            await this.db.dropCollection('txs');
            await this.db.dropCollection('logs');
            this.blocksCollection = this.db.collection('blocks');
            this.transactionsCollection = this.db.collection('txs');
            this.logsCollection = this.db.collection('logs');
        } catch (err) {
            console.error('Error connecting to MongoDB:', err);
            process.exit(1);
        }
    }
    async  processFiles(files, processor) {
        const promises = files.map(async (file) => {
            const filePath = path.join(processor.blockDataDir, file);
            let [blockInfo, txInfo] = await processor.readAndProcessEntries(filePath);
            if (blockInfo.length === 0) {
                console.log(`No entries in file ${filePath}`);
                return;
            }
            console.log(`Processing ${file}`, `totalEntries = ${blockInfo.length}`);

            try {
                let res = await processor.chClient.bulkWrite(blockInfo, 'blocks');
                console.log(res);
                console.log(`ProcessedBlocks in ${file}`, `totalEntries = ${blockInfo.length}, Persisted = true`);
            } catch (err) {
                console.log(err);
            }

            if (txInfo.length > 0) {
                try {
                    await processor.chClient.bulkWrite(txInfo, 'txs');
                    console.log(`ProcessedTxs in  ${file}`, `totalEntries = ${txInfo.length}, Persisted = true`);
                } catch (err) {
                    console.log(err);
                }
            }
        });

        await Promise.allSettled(promises);
    }
    async runLogs() {
         const files = fs.readdirSync(this.logDataDir);
         for(const file of files) {
             const filePath = path.join(this.logDataDir, file);
             const logInfo = await this.readAndProcessLogs(filePath);
             if(logInfo.length == 0) {
                 console.log(`No logs in file ${filePath}`);
                 continue;
             }
             console.log(`Processing ${file}`, `totalEntries = ${logInfo.length}`)

             try {
                 //await this.mysqlClient.bulkWrite(blockInfo, 'blocks');
                 let res = await this.chClient.bulkWrite(logInfo, 'logs');
                 console.log(res);
             } catch (err) {
                 console.log(err);
             } finally {
                 console.log(`ProcessedLogs in ${file}`, `totalEntries = ${logInfo.length}, Persisted = true`);
             }
         }
    }
    async run() {
        const files = fs.readdirSync(this.blockDataDir);


// Create an instance of the DbProxy
        //const files = ['./logs-archive/logs_1000000_1000099.json']
        for (const file of files) {
            const filePath = path.join(this.blockDataDir, file);
            let [blockInfo, txInfo] = await this.readAndProcessEntries(filePath);
            if (blockInfo.length == 0) {
                console.log(`No entries in file ${filePath}`);
                continue;
            }
            console.log(`Processing ${file}`, `totalEntries = ${blockInfo.length}`)

            try {
                //await this.mysqlClient.bulkWrite(blockInfo, 'blocks');
                let res = await this.chClient.bulkWrite(blockInfo, 'blocks');
                console.log(res);
            } catch (err) {
                console.log(err);
            } finally {
                console.log(`ProcessedBlocks in ${file}`, `totalEntries = ${blockInfo.length}, Persisted = true`);
            }
            if (txInfo.length > 0) {
                try{
                    //console.log(txInfo)
                   await this.chClient.bulkWrite(txInfo, 'txs');
                } catch(err) {
                    console.log(err);
                } finally {
                    console.log(`ProcessedTxs in  ${file}`, `totalEntries = ${txInfo.length}, Persisted = true`);

                }
            }
        }
        process.exit(0)
    }
}

let indexer = new Indexer();
indexer.init().then(() => {
    indexer.runLogs();
});