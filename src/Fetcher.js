const axios = require('axios');
const request = require('superagent');
const config = require('./Utils/config');
const Utils = require("./Utils/helpers");

class Fetcher {
    constructor(provider) {
        this.providerConfig = provider.config;
        this.provider = provider
        console.log("Fetcher has been created..")
    }
    async getLogs(blockNumber) {
        try {
            let logs = await this.provider.getLogs(blockNumber);
            return logs;
        } catch (error) {
            console.log(error)
        }
    }
    async getBlockWithTxs(blockNumber) {
        try {
            let blockInfo = await this.provider.getBlockWithTransactions(blockNumber);
            return blockInfo;
        } catch (error) {
            console.log(error)
        }
    }
    async getBlock(blockNumber) {
        try {
            let block = await this.provider.getBlock(blockNumber);
            return block;
        } catch (error) {
            console.log(error)
        }
    }
    async getBlockTrace(blockNumber) {
        let res = [];
        const body = Utils.TraceBlock(blockNumber);
        try {
            //randomize url
            let index = Math.floor(Math.random() * this.providerConfig.urls.length);
            let url = this.providerConfig.urls[index];
            //console.log(url);
            const response = await request
                .post(url)
                .send(body)
                .set('Content-Type', 'application/json');
            //console.log(response.body);
            return response.body;
        } catch (error) {
            console.log(error)
        }
    }
    async getTxTrace(tx) {
        let res = [];
        const body = Utils.TraceTx(tx);
        try {
            const response = await request
                .post(this.baseProvider.url)
                .send(body)
                .set('Content-Type', 'application/json');
            return response.body;
        } catch (error) {
            console.log(error)
        }
    }

}

module.exports = { Fetcher };