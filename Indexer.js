const fs = require('fs');
const path = require('path');
const { MongoClient, Long } = require('mongodb');
const Utils = require("./src/Utils/helpers");
const {convertObjectToArray} = require("ioredis/built/utils");
const mysql = require('mysql');
const connectionConfig = {
    host: '127.0.0.1', // or the IP address or hostname of your database server
    user: 'root',
    password: 'mysql',
    database: 'mainnet'
};
const DbProxy  = require('./src/dbproxy');

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
        txInfo.time = new Date(txInfo.timestamp * 1000);
        txInfo.value = parseFloat(Utils.FormatValue(tx.value));
        txInfo.input = tx.input;
        //txInfo.meta = block.meta.time;
        txInfo.method_id = Utils.MethodID(tx.input);
        Object.assign(txInfo, Utils.TimeMeta(txInfo.time));
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
        blockInfo.time = new Date(entry.timestamp * 1000);

        Object.assign(blockInfo, Utils.TimeMeta(blockInfo.time));
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

    async readAndProcessEntries(filePath) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const blocks = JSON.parse(fileContent);
        let blockInfo = [];
        let txInfo = []
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
        return [ blockInfo, txInfo ];
        //return blocks.map(this.processFullBlockEntry);
    }

    constructor() {
        this.blockDataDir = path.join(__dirname, 'blocks-tx-archive');
        this.mongoClient = new MongoClient('mongodb://localhost:27017');
        this.mysqlClient = new DbProxy(connectionConfig);
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

    async run() {
        const files = fs.readdirSync(this.blockDataDir);
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
                await this.mysqlClient.bulkWriteBlocks(blockInfo);

            } catch (err) {
                console.log(err);
            } finally {
                console.log(`ProcessedBlocks in ${file}`, `totalEntries = ${blockInfo.length}, Persisted = true`);
            }
            if (txInfo.length > 0) {
                try{
                    await this.mysqlClient.bulkWriteTxs(txInfo);
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
    indexer.run();
});