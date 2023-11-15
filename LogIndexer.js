const fs = require('fs');
const path = require('path');
const { MongoClient, Long } = require('mongodb');
const Utils = require("./src/Utils/helpers");
class LogIndexer {
    processLogEntry(logEntry) {
        // Convert hex fields to decimal
        logEntry.blockNumber = Utils.Int(logEntry.blockNumber);
        logEntry.transactionIndex = Utils.Int(logEntry.transactionIndex);
        logEntry.logIndex = Utils.Int(logEntry.logIndex);
        if(logEntry.topics.length > 0) {
            logEntry.topicID = logEntry.topics[0];
        }

        return logEntry;
    }

    async readAndProcessLogs(filePath) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const logs = JSON.parse(fileContent);
        return logs.map(this.processLogEntry);
    }

    constructor() {
        this.blockDataDir = path.join(__dirname, 'logs-archive');
        this.mongoClient = new MongoClient('mongodb://localhost:27017');
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
            this.blocksCollection = this.db.collection('blocks');
            this.transactionsCollection = this.db.collection('transactions');
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
            const logs = await this.readAndProcessLogs(filePath);
            if(logs.length == 0) {
                console.log(`No logs in file ${filePath}`);
                continue;
            }
            console.log(`Processing ${file}`, `totalEntries = ${logs.length}`)

            let res = await this.logsCollection.insertMany(logs, { ordered: false });
            console.log(`Processing Completed: ${file}, Persisted = ${res.acknowledged}`);
        }
        process.exit(0)
    }
}

let l = new LogIndexer();
l.init().then(() => {
    l.run();
});