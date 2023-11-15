const { processor, backlogQueue } = require('../Utils/ServiceLocator');
class BacklogWorker {

    async process() {
        backlogQueue.process(2, async (job) => {
            await processor.block(job.data.blockNumber, false, true);
            console.log("Processing Job: ", job.data);
            return done(null, job.data);
        });
    }
}
const worker = new BacklogWorker();
worker.process()