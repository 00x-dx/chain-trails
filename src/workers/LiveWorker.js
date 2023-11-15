const { processor, liveQueue } = require('../Utils/ServiceLocator');
class LiveWorker {

    async process() {
        liveQueue.process(1, async (job) => {
            await processor.block(job.data.blockNumber, false, false, true);
            console.log("Processing Job: ", job.data);
            return done(null, job.data);
        });
    }
}
const liveWorker = new LiveWorker();
liveWorker.process()