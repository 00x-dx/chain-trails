const Utils = require("./Utils/helpers");
const axios = require('axios');

// process
// -> fetchFullBlock, TODO: add Logs, Traces etc.
// -> processFullBlock
// -> storeFullBlock

class Processor {
    constructor(provider, db, dlqQueue) {
        this.provider = provider;
        this.db = db;
        this.dlqQueue = dlqQueue;
    }

    async process(blockJobs) {
        let blocks = []
        for(let blockJob of blockJobs) {
            blocks.push(blockJob.blockNumber)
        }
        //sort blocks in ascending order
        if(blocks.length > 1) {
            blocks.sort((a, b) => a - b);
            let[start, end] = [blocks[0], blocks[blocks.length - 1]];
            console.log(`Processing blocks from ${start} to ${end}`);
        } else {
            console.log(`Processing block ${blocks[0]}`);
        }
        let rawBlocks, decoratedBlocks;
        try {
            rawBlocks = await this.fetchBlockWithTxs(blocks);
        } catch (err) {
            console.log("Operation = fetchBlockWithTxs error = ", err);
            await this.dlqQueue.addJob({blocks: blocks});
        }
        try {
            decoratedBlocks = this.decorateFullBlocks(rawBlocks);
        } catch (err) {
            console.log("Operation = decorateFullBlocks error = ", err);
            await this.dlqQueue.addJob({blocks: blocks});
        }
        try {
            await this.storeBlocks(decoratedBlocks);
        } catch (err) {
            console.log("Operation = storeBlocks error = ", err);
            await this.dlqQueue.addJob({blocks: blocks});
        }
    }
    // TODO: for future optimization on batchCalls & batchInserts.
    async storeBlocks(decoratedBlocks) {
        try {
            await this.db.bulkWrite(decoratedBlocks.blockInfo, "blocks");
            if(decoratedBlocks.txInfo.length > 0) {
                await this.db.bulkWrite(decoratedBlocks.txInfo, "txs");
            }
        } catch (err) {
            console.log(err);
        } finally {
            // fetch block numbers from blockInfo array
            let blockNumbers = decoratedBlocks.blockInfo.map(block => block.block_number);
            console.log(`blockNumbers = ${blockNumbers}, Persisted = true`);
        }
    }

    async storeBlock(decoratedBlock) {
        let [blockInfo, txInfo] = [decoratedBlock.blockInfo, decoratedBlock.txInfo];
        try {
            await this.db.bulkWrite(blockInfo, "blocks");
            if(txInfo.length > 0) {
                await this.db.bulkWrite(txInfo, "txs");
            }
        } catch (err) {
            console.log(err);
        } finally {
            console.log(`blockNumber = ${blockInfo.block_number}, Persisted = true`);
        }

    }


    async fetchBlockWithTxs(blocks) {
        let batchData = [];
        // TODO: for future optimization on batchCalls.
        if(blocks.length > 1) {
            for(let block of blocks) {
                batchData.push(Utils.BlockWithTransactions(block));
            }
            console.log(`Fetching blocks ${blocks[0]} to ${blocks[blocks.length - 1]}`);
        } else {
            batchData.push(Utils.BlockWithTransactions(blocks[0]));
            console.log(`Fetching block ${blocks[0]}`);
        }
        //TODO: randomize RPC_URL


        let RPC_URL = this.provider.config.urls[0];
        //console.log(`RPC_URL: ${RPC_URL}`);
        let rawBlocks = [];
        try {
            const response = await axios.post(RPC_URL, batchData);
            //console.log(`response: ${JSON.parse(response)}`)
            rawBlocks = response.data.map(res => res.result).filter(block => block !== null);
            //console.log(`blocks: ${JSON.stringify(rawBlocks, null, 2)}`)
            return rawBlocks;
        } catch (error) {
            console.log(error)
        }

    }
     decorateFullBlocks(blocks) {
        //const blocks = JSON.parse(rawBlocks);
        let blockInfo = [];
        let txInfo = [];
        // for future batch processing of blocks.
        for (let block of blocks) {
            let res = this.decorateFullBlock(block);
            blockInfo.push(res.blockInfo);
            if(res.txInfo.length > 0) {
                // iterate over res.txInfo and add elements to txInfo
                for(let tx of res.txInfo) {
                    txInfo.push(tx);
                }
            }
        }

       return {
            blockInfo: blockInfo,
            txInfo: txInfo
        };
        //return blocks.map(this.processFullBlockEntry);

        //return blocks.map(this.processFullBlockEntry);
    }

    decorateFullBlock(entry) {
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
        // TODO: Logs, Traces etc.

        if(txInfo.length > 0) {
            //console.log(txInfo)
        }

        return {
            blockInfo: blockInfo,
            txInfo: txInfo
        }
    }
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
}

module.exports = { Processor };