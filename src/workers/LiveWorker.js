const { processor, liveQueue } = require('../Utils/ServiceLocator');
class LiveWorker {

    async process() {
        liveQueue.process(1, async (job) => {
            await processor.process(job.data.blocks);
            console.log("Processing Job: ", job.data.blocks[0]);
            return done(null, job.data);
        });
    }
}
const liveWorker = new LiveWorker();
liveWorker.process()