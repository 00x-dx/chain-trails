const {Alchemy, Network} = require("alchemy-sdk");

class Provider {
    constructor(apiKey, network, config) {
        if( network === "optimism") {
            network = Network.OPT_MAINNET
        } else if (network === "arbitrum") {
            network = Network.ARB_MAINNET
        }
        this.apiKey = apiKey;
        this.network = network;
        this.client = new Alchemy({
            apiKey: apiKey,
            network: network
        });
        this.config = config;
        console.log(this.client)
        console.log("Provider has been created..")
    }
    async getCurrentBlockNumber() {
        return await this.client.core.getBlockNumber()
    }
    listenToNewBlocks(callback) {
        this.client.ws.on('block', async (blockNumber) => {
            try {
                callback(blockNumber);
            } catch (error) {
                console.log("Error on block subscription: " + error)
            }
        });
    }
}

module.exports = { Provider };