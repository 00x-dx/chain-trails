const {BigNumber} = require("alchemy-sdk");
const yaml = require("js-yaml");
const fs = require("fs");
const utils = require("ethers");
class Helpers {

    static HexToBytes(hexString) {
        const input = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
        return input.length / 2;
    }
    static TruncDate(input) {
        let date = new Date(input * 1000)
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
    static LoadConfig() {
        let config;
        try {
            config = yaml.load(fs.readFileSync('../config.yaml', 'utf8'));
        } catch (error) {
            console.error("Error loading config.yaml " + error.message);
        }
        return config;
    }
    static Key(prefix, key) {
        return prefix + ":" + key;
    }
    static Int(input) {
        if (typeof input === "string") {
            input = BigNumber.from(input)
        }
        return input.toNumber()
    }
    static Hex(input) {
        return "0x" + input.toString(16)
    }
    static TraceTx(tx) {
        return {
            "jsonrpc": "2.0",
            "method": "debug_traceTransaction",
            "params": [tx, {'tracer': 'callTracer'}],
            "id": 1
        }
    }
    static TraceBlock(blockNumber) {
        return {
            "jsonrpc": "2.0",
            "method": "debug_traceBlockByNumber",
            "params": [this.Hex(blockNumber), {'tracer': 'callTracer'}],
            "id": 1
        }
    }
    static BlockWithTransactions(blockNumber) {
        return {
            "jsonrpc": "2.0",
            "method": "eth_getBlockByNumber",
            "params": [this.Hex(blockNumber), true],
            "id": 1
        }
    }
    static MethodID(inputData) {
        const ETHER_TRANSFER = "0";
        const INVALID_INPUT = "-1";

        if (inputData === "0x") {
            return ETHER_TRANSFER;
        } else if (inputData.startsWith('0x') && inputData.length >= 10) {
            return inputData.slice(2, 10);
        }
        return INVALID_INPUT;
    }

    static BlockMeta(block) {
        return {
            "timestamp": block.timestamp
        }
    }

    static FormatValue(input) {
        return utils.formatUnits(input, 'ether');
    }
    static FormatAmount(amount) {
        return utils.formatUnits(amount, 'wei');
    }
    static TimeMeta(time) {
        return {
            month: time.getMonth(),
            year: time.getFullYear(),
            day: time.getDate(),
            hour: time.getHours(),
            minute: time.getMinutes(),
        }
    }
    static GasMeta(gasValues) {
        let totalGas = 0;
        gasValues.forEach(gas => {
            totalGas += gas;
        });
        let avgGas = gasValues.length > 0 ? totalGas / gasValues.length : 0;
        let mid = Math.floor(gasValues.length / 2);
        gasValues.sort((a, b) => a - b);
        let medianGas = gasValues.length % 2 !== 0 ? gasValues[mid] : (gasValues.length > 0 ? (gasValues[mid - 1] + gasValues[mid]) / 2 : 0);

        return {
            avg: avgGas,
            median: medianGas,
            total: totalGas
        }
    }
    static CallDataMeta(callData) {
        let totalCalldataBytes = callData.reduce((total, tx) => {
            return total + this.HexToBytes(tx.input);
        }, 0);
        let avgCalldataBytes = callData.length > 0 ? totalCalldataBytes / callData.length : 0;
        return {
            total: totalCalldataBytes,
            avg: avgCalldataBytes
        }
    }
    static TxsMeta(txs) {
        let totalCalldataBytes = txs.reduce((total, tx) => {
            return total + this.HexToBytes(tx.input);
        }, 0);
        let callData_ = this.CallDataMeta(txs);
        let gas_ = this.GasMeta(txs.map(tx => this.Int(tx.gas)));
        return {
            tx_count: txs.length,
            calldata_total: callData_.total,
            calldata_avg: callData_.avg,
            gas_total: gas_.total,
            gas_avg: gas_.avg,
            gas_median: gas_.median,

        }
    }
    static WithdrawalsMeta(withdrawals= []) {
        if (withdrawals.length === 0) {
            return {
                withdrawals_count: 0,
                withdrawals_total: 0,
            }
        }
        let total = 0.0;
        for(let w of withdrawals) {
            total += ( this.FormatValue(w.amount) * 10**9);
        }
        return {
            count: withdrawals.length,
            total: total,
        }
    }

    static processTransaction(tx, block) {
        // Convert hex fields to decimal and add metadata for each transaction
        tx.blockNumber = block.blockNumber;
        tx.gas = Utils.Int(tx.gas);
        tx.gasPrice = Utils.Int(tx.gasPrice);
        tx.nonce = Utils.Int(tx.nonce);
        tx.callDataSize = Utils.HexToBytes(tx.input);
        tx.timestamp = Utils.Int(tx.timestamp);
        tx.time = new Date(tx.timestamp * 1000);
        tx.value = Utils.Int(tx.value);
        tx.meta = {
            ...block.meta.time,
        };
        tx.methodID = Utils.MethodID(tx.input);
        return tx;
    }
    static processTransactions(txs, time) {
        let transactionsInfo = [];
        console.log(txs);
        for (let tx of txs) {
            let processedTx = this.processTransaction(tx, time);
            transactionsInfo.push(processedTx);
        }
        return transactionsInfo;
    }
}

module.exports = Helpers;