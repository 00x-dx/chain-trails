const { processor, backlogQueue } = require('../Utils/ServiceLocator');
class BacklogWorker {

    async process() {
        backlogQueue.process(3, async (job) => {
            await processor.process(job.data.blocks);
            console.log("Processing Job: ", job.data);
            return done(null, job.data);
        });
    }
}
const worker = new BacklogWorker();
worker.process()