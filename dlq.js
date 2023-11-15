const serviceLocator = require('./src/Utils/ServiceLocator');
const { processor, db } = serviceLocator;
async function processDLQ() {
    const dlqCollection = await db.getCollection(db.config.collection.dlq);
    try {
        const dlqEntry = await dlqCollection.find({})
            .sort({ timestamp: 1 })
            .limit(1)
            .toArray();

        if (dlqEntry.length === 0) {
            console.log('DLQ is empty. No entries to process.');
            return;
        }

        const entry = dlqEntry[0];
        try {
            await processor.block(entry.blockNumber, false, true);

            await dlqCollection.deleteOne({ _id: entry._id });
            console.log(`Successfully reprocessed and removed block number ${entry.blockNumber} from DLQ.`);
        } catch (error) {
            console.error(`Failed to reprocess block number ${entry.blockNumber} from DLQ:`, error);
            await dlqCollection.updateOne(
                { _id: entry._id },
                { $set: { timestamp: new Date() } } // Updating the timestamp or you can add a retry count
            );
        }
    } catch (error) {
        console.error('An error occurred while processing the DLQ:', error);
    }
}
const DLQ_PROCESS_INTERVAL = 10000; // time in ms, e.g., 10000ms = 10 seconds

setInterval(() => {
    processDLQ().catch(console.error);
}, DLQ_PROCESS_INTERVAL);
