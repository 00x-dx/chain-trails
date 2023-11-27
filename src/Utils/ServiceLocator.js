const { EtherProvider } = require('../EtherProvider');
const { Processor } = require('../Processor');
const config = require('./config');
const { Queue } = require("../Queue");
const { CHProxy } = require("../CHProxy");
class ServiceLocator {
    constructor() {
        this.providerConfig = config.get('provider');
        console.log(this.providerConfig)
        this.dbConfig = config.get('clickhouse');
        console.log(this.dbConfig)
        this.queueConfig = config.get('queue');
        console.log(this.queueConfig)
        // Create the provider
        this.provider = new EtherProvider(
            this.providerConfig
        );

        // Initialize other dependencies
        this.db = new CHProxy(this.dbConfig);
        //this.fetcher = new Fetcher(this.provider);
        this.liveQueue = new Queue(this.queueConfig.list.live, this.queueConfig.url);
        this.backlogQueue = new Queue(this.queueConfig.list.backlog, this.queueConfig.url);
        this.dlqQueue = new Queue(this.queueConfig.list.dlq, this.queueConfig.url);
        this.processor = new Processor(this.provider, this.db, this.dlqQueue);

    }

    getDb() {
        return this.db;
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
    getDlqQueue() {
        return this.dlqQueue;
    }
}

const serviceLocator = new ServiceLocator();
module.exports = serviceLocator;
