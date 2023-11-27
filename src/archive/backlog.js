const serviceLocator = require('../Utils/ServiceLocator');
const { backlogQueue } = serviceLocator;


async function addToBacklog(from, to, batchSize = 100) {

    let blocks = []

    for (let blockNumber = from; blockNumber < to; blockNumber++) {
        try {
            blocks.push({
                blockNumber: blockNumber,
                time: new Date()
            });
            if (blocks.length >= batchSize || blockNumber === to - 1) {
                await backlogQueue.addJob({ blocks: blocks });
                console.log(`Added blocks ${blocks[0].blockNumber} to ${blocks[blocks.length - 1].blockNumber} to backlog queue.`);
                blocks = [];
            }
        } catch (error) {
            console.error(`Failed to add block number ${blockNumber} to backlog queue:`, error);
        }
    }
}


addToBacklog(1319600, 1319901);
