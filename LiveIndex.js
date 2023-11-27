const serviceLocator = require('./src/Utils/ServiceLocator');
const { provider, liveQueue, db  } = serviceLocator;
class LiveIndex {
    async run() {
        provider.listenToNewBlocks(async (blockNumber) => {
            let lastBlockNumber = await db.getLastBlockNumber()
            let blocks = [];
            console.log("Latest blockNumber: ", blockNumber);
            for(let i = lastBlockNumber + 1 ; i <= blockNumber; i++) {
                blocks.push({
                    blockNumber: i,
                    time: new Date()
                })

                if(blocks.length >= provider.config.batch.size || i === blockNumber) {
                    if(blocks.length > 1) {
                        console.log("StartingBlock: ", blocks[0].blockNumber, "EndingBlock: ", blocks[blocks.length - 1].blockNumber);
                    }
                    await liveQueue.addJob({blocks: blocks})

                    blocks = []
                }
            }

        });
    }
}
const liveIndex = new LiveIndex();
liveIndex.run()