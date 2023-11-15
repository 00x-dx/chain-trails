const Utils = require("./Utils/helpers");
const Decorator = require("./Utils/decorator");
const request = require("superagent");
const {Block} = require("ethers");
const dbConfig = require("./Utils/config").get("mongo");
class Processor {
    constructor(fetcher, db) {
        this.fetcher = fetcher;
        this.db = db;
        console.log("Processor has been created..")
    }
    async traces_tx(blockNumber, txs){
        let res_ = [];
        for (let tx of txs) {
            let trace = await this.fetcher.getTxTrace(tx);
            if(trace.result) {
                res_.push({
                    "blockNumber": blockNumber,
                    "hash": tx,
                    "traces": trace.result
                })
            }
        }
        return res_;
    }
    async traces(blockNumber, txs){
        let res_ = [];
        let traceInfo = await this.fetcher.getBlockTrace(blockNumber);

        if(traceInfo && Array.isArray(traceInfo.result) && traceInfo.result.length > 0) {
            for (let i = 0; i < traceInfo.result.length; i++) {
                res_.push({
                    "blockNumber": blockNumber,
                    "hash": txs[i],
                    "traces": traceInfo.result[i].result
                })
            }
            return res_;
        }
        return null;
    }
    async logs(blockNumber) {
        let logs = await this.fetcher.getLogs(blockNumber);
        let res = {}

        for(let log of logs) {
            if(res[log.transactionHash] === undefined) {
                res[log.transactionHash] = [log]
            } else {
                res[log.transactionHash].push(log)
            }
        }
        let res_ = [];
        for (let key in res) {
            res_.push({
                "hash": key,
                "blockNumber": blockNumber,
                "logs": res[key]
            })
        }
        return res_;
    }
    async block(blockNumber, logs = false, trace= false, persistanceCheck = false) {
        const logHash = { BlockNumber: blockNumber, Result: [], Persisted: false };

        try {
            if(persistanceCheck) {
                const isPersisted = await this.db.isPersisted(blockNumber);
                if (isPersisted) {
                    console.log(`Block ${blockNumber} has already been persisted. Skipping processing.`);
                    return; // Early return if the block has already been persisted
                }
            }
            let blockInfo = await this.fetcher.getBlock(blockNumber);
            if (blockInfo) {

                let blockRes = await this.db.save(dbConfig.collection.blocks, { number: blockNumber }, blockInfo);
                logHash.Result.push({ "blockInfo": blockRes.message });

                let blockInfoWithTx = await this.fetcher.getBlockWithTxs(blockNumber);

                if (blockInfoWithTx?.result?.transactions?.length > 0) {
                    let meta = Utils.BlockMeta(blockInfoWithTx.result);
                    let transactions = Decorator.Txs(blockInfoWithTx.result.transactions, meta);
                    console.log("Transactions:", transactions);

                    // Save transactions to the database and log result
                    let txRes = await this.db.saveBatch(dbConfig.collection.transactions, transactions);
                    logHash.Result.push({"txInfo": txRes.acknowledged});
                } else {
                    logHash.Result.push({"txInfo": "No transactions"});
                }

                if(logs) {
                    let logsInfo = await this.logs(blockNumber);
                    if (logsInfo && logsInfo.length > 0) {
                        let logsRes = await this.db.saveBatch(dbConfig.collection.logs, logsInfo);
                        logHash.Result.push({"logsInfo": logsRes.acknowledged});
                    }
                }
                if(trace) {
                    let tracesInfo = await this.traces(blockNumber, blockInfo.transactions);
                    if (tracesInfo && tracesInfo.length > 0) {
                        let tracesRes = await this.db.saveBatch(dbConfig.collection.traces, tracesInfo);
                        logHash.Result.push({"traceInfo": tracesRes.acknowledged});
                    }
                }

                await this.db.createCheckpoint(blockNumber);
                logHash.Persisted = true;
            }
        } catch (error) {
            console.error(`An error occurred while processing block ${blockNumber}:`, error);
            await this.db.addToDLQ(blockNumber, error, dbConfig.collection.dlq);
        } finally {
            console.log(logHash);
        }
    }
}

module.exports = { Processor };