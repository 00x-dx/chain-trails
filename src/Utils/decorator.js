const Utils = require("./helpers");
class Decorator {

    static Txs(data, blockInfo) {
        data = JSON.parse(JSON.stringify(data));
        const txFieldsToConvert = ["blockNumber", "gas", "gasPrice", "maxPriorityFeePerGas", "maxFeePerGas", "nonce", "transactionIndex", "value", "type", "chainId"];
        let txInfo = data.map(tx => {
            let transaction = {};
            txFieldsToConvert.forEach(field => {
                if(tx[field]) {
                    try {
                        transaction[field] = (field === "value") ? Utils.FormatValue(tx[field]): Utils.Int(tx[field]);
                    } catch (error) {
                        console.log("Error on converting field: " + field + " to int"+ "value: " + tx[field]);
                        console.log(error)
                    }
                }
                else {
                    transaction[field] = null;
                }
            });

            // Other fields that don't need conversion
            transaction.blockHash = tx.blockHash;
            transaction.from = tx.from;
            transaction.hash = tx.hash;
            transaction.input = tx.input;
            transaction.to = tx.to;
            transaction.accessList = tx.accessList;
            transaction.r = tx.r;
            transaction.s = tx.s;
            transaction.v = tx.v;
            transaction.methodID = Utils.MethodID(tx.input);
            transaction.timestamp = Utils.TruncDate(blockInfo.timestamp);

            return transaction;
        });
        return txInfo;
    }
    static Block(data) {
        return data;
    }
}
module.exports = Decorator;