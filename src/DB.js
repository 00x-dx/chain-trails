const {MongoClient} = require("mongodb");
const config = require('./Utils/config');
const dbConfig = config.get('mongo')
const dbCollection = dbConfig.collection
class DB {
    constructor(dbConfig) {
        this.client = new MongoClient(dbConfig.url);
        try {
            this.client.connect();
            this.db = this.client.db(dbConfig.db);
            this.config = dbConfig;
        } catch (error) {
            console.log("Error while connecting to db: "+error);
        } finally {
            console.log("Connected to db ");
        }

    }
    async getCollection(collectionName) {
        return this.db.collection(collectionName);
    }
    async save(collectionName, query, data) {
        const collection = this.db.collection(collectionName);

        // Check if the document already exists
        const exists = await collection.findOne(query);
        let response;
        if (!exists) {
            response = await collection.insertOne(data);
        } else {
            return { data: data, message: 'Document already exists' };
        }
        return response;
    }
    async saveBatch(collectionName, records) {
        const collection = this.db.collection(collectionName);
        try {
            return await collection.insertMany(records, { ordered: false });
        } catch (error) {
            console.log(records)
            throw new Error(`Failed to insert records into ${collectionName}: ${error.message}`);
        }
    }

    async  createCheckpoint(blockNumber) {
        const collection = this.db.collection(dbCollection.checkpoints);
        try {
            return await collection.updateOne(
                { number: blockNumber },
                { $set: { persisted: true } },
                { upsert: true }
            );
        } catch (error) {
            throw new Error(`Failed to create a checkpoint for block ${blockNumber}: ${error.message}`);
        }
    }
    async isPersisted(blockNumber) {
        const collection = this.db.collection(dbCollection.checkpoints);
        try {
            const checkpoint = await collection.findOne({ number: blockNumber });
            return checkpoint && checkpoint.persisted;
        } catch (error) {
            throw new Error(`Failed to check if block ${blockNumber} is persisted: ${error.message}`);
        }
    }

    async  addToDLQ(blockNumber, error, collectionName) {
        const collection = this.db.collection(collectionName);
        try {
            await collection.insertOne({
                blockNumber: blockNumber,
                timestamp: new Date(),
                error: error.message
            });
        } catch (dlqError) {
            // If the error logging fails, log to console or another logging system
            console.error(`Failed to add block ${blockNumber} to the DLQ:`, dlqError);
        }
    }

}

module.exports = { DB };