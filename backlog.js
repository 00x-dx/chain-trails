const serviceLocator = require('./src/Utils/ServiceLocator');
const { backlogQueue } = serviceLocator;


async function addToBacklog(from, to) {
    if (from >= to) {
        console.error('The "from" block number must be less than the "to" block number.');
        return;
    }

    for (let blockNumber = to; blockNumber > from; blockNumber--) {
        try {
            await backlogQueue.addJob({ blockNumber: blockNumber, time: new Date() });
            console.log(`Added block number ${blockNumber} to backlog queue.`);
        } catch (error) {
            console.error(`Failed to add block number ${blockNumber} to backlog queue:`, error);
        }
    }
}


addToBacklog(0, 1353892);
