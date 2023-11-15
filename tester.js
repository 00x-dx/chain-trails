const { processor, liveQueue } = require('./src/Utils/ServiceLocator');

async function process(blockNumber) {
    await processor.block(blockNumber, false, false, false);
    console.log("Processing Job: ", blockNumber);
}

blockNumbers = 1223473
process(blockNumbers)

