const {ethers} = require("ethers");
const Utils = require("./Utils/helpers");
const request = require('superagent');

class EtherProvider {
    constructor(config) {
        this.client = new ethers.JsonRpcProvider(config.urls[0])
        this.config = config;
        console.log(this.client)
        console.log("Provider has been created..", this.client)
    }
    async getCurrentBlockNumber() {
        return await this.client.getCurrentBlockNumber()
    }
    async getBlock(blockNumber) {
        return await this.client.getBlock(blockNumber, true)
    }
    async getBlockWithTransactions(blockNumber) {
        let body = Utils.BlockWithTransactions(blockNumber);
        try {
            let index = Math.floor(Math.random() * this.config.urls.length);
            let url = this.config.urls[index];
            const response = await request
                .post(url)
                .send(body)
                .set('Content-Type', 'application/json');
            return response.body;
        } catch (error) {
            console.log(error)
        }

    }
    async getLogs(blockNumber) {
        return await this.client.getLogs(blockNumber)
    }
    listenToNewBlocks(callback) {
        this.client.on('block', async (blockNumber) => {
            try {
                callback(blockNumber);
            } catch (error) {
                console.log("Error on block subscription: " + error)
            }
        });
    }
}

module.exports = { EtherProvider };