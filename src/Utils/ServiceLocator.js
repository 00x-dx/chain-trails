const { Provider } = require('../Provider');
const { EtherProvider } = require('../EtherProvider');
const { DB } = require('../DB');
const { Fetcher } = require('../Fetcher');
const { Processor } = require('../Processor');
const config = require('./config');
const { Queue } = require("../Queue");

class ServiceLocator {
    constructor() {
        this.providerConfig = config.get('provider');
        console.log(this.providerConfig)
        this.dbConfig = config.get('mongo');
        console.log(this.dbConfig)
        this.queueConfig = config.get('queue');
        console.log(this.queueConfig)
        // Create the provider
        this.provider = new EtherProvider(
            this.providerConfig
        );

        // Initialize other dependencies
        this.db = new DB(this.dbConfig);
        this.fetcher = new Fetcher(this.provider);
        this.processor = new Processor(this.fetcher, this.db);
        this.liveQueue = new Queue(this.queueConfig.list.live, this.queueConfig.url);
        this.backlogQueue = new Queue(this.queueConfig.list.backlog, this.queueConfig.url);
    }

    getDb() {
        return this.db;
    }

    getFetcher() {
        return this.fetcher;
    }

    getProcessor() {
        return this.processor;
    }
    getLiveQueue() {
        return this.liveQueue;
    }
    getProvider() {
        return this.provider;
    }
    getBacklogQueue() {
        return this.backlogQueue;
    }
}

const serviceLocator = new ServiceLocator();
module.exports = serviceLocator;
