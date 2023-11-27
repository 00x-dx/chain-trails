const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function getCurrentBlockNumber(rpcUrl) {
    try {
        const data = {
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: [],
            id: 1
        };

        const response = await axios.post(rpcUrl, data);
        return parseInt(response.data.result, 16);
    } catch (error) {
        console.error('Error getting current block number:', error);
        return null;
    }
}


async function fetchLogs(rpcUrl, fromBlock, toBlock) {
    try {
        const data = {
            jsonrpc: "2.0",
            method: "eth_getLogs",
            params: [{
                fromBlock: fromBlock,
                toBlock: toBlock
                // topics: [topic]
            }],
            id: 1
        };

        const response = await axios.post(rpcUrl, data);
        return response.data.result;
    } catch (error) {
        console.error('Error fetching logs:', error);
        return null;
    }
}

async function batchFetchLogs(rpcUrl, batchSize = 30000) {
    try {
        let currentBlockNumber = await getCurrentBlockNumber(rpcUrl);
        currentBlockNumber -= currentBlockNumber % batchSize; // Round down to the nearest batch size
        currentBlockNumber = 1090000
        const logsDir = path.join(__dirname, 'logs-archive');

        // Create the directory if it doesn't exist
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }

        // Iterate in batches from the current rounded block number to zero
        for (let block = currentBlockNumber; block > 0; block -= batchSize) {
            let batchStartBlock = Math.max(block - batchSize, 0); // Ensure the start block is not less than 0
            let fromBlockHex = '0x' + batchStartBlock.toString(16);
            let toBlockHex = '0x' + (block - 1).toString(16); // -1 because the range is inclusive
            console.log(`Fetching logs from ${batchStartBlock} to ${block - 1}...`);
            const logs = await fetchLogs(rpcUrl, fromBlockHex, toBlockHex);
            console.log(`Fetched logs from ${batchStartBlock} to ${block - 1}`);

            // Save logs to a file with batch range in filename
            let filename = `logs_${batchStartBlock}_${block - 1}.json`;
            fs.writeFileSync(path.join(logsDir, filename), JSON.stringify(logs, null, 2));
            // sleep for 1 second to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        console.log('All logs fetched and saved.');
    } catch (err) {
        console.error('Error fetching logs:', err);
    }
}


// Example usage
const RPC_URL = 'https://rpc.eu-central-1.gateway.fm/v4/lukso/non-archival/mainnet'; // Replace with your Ethereum node RPC URL
const TOPIC = 'YOUR_TOPIC'; // Replace with your topic
batchFetchLogs(RPC_URL, 10000).then(() => {
    console.log('Done');
});
