const serviceLocator = require('./src/Utils/ServiceLocator');
const { provider, liveQueue } = serviceLocator;
class LiveIndex {
    async run() {
        provider.listenToNewBlocks(async (blockNumber) => {
            //blockNumber -= 10
            await liveQueue.addJob({ blockNumber: blockNumber, time: new Date() })
            // await processor.block(blockNumber);
            console.log("blockNumber: ", blockNumber);
        });
    }
}
const liveIndex = new LiveIndex();
liveIndex.run()