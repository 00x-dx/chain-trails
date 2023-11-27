const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Utils = require("../Utils/helpers");

// Ethereum RPC URL
const RPC_URL = 'https://rpc.eu-central-1.gateway.fm/v4/lukso/non-archival/mainnet'; // Replace with your Ethereum node RPC URL

// Directory to store the block data
const blockDataDir = path.join(__dirname, 'blocks-tx-archive');
if (!fs.existsSync(blockDataDir)) {
    fs.mkdirSync(blockDataDir);
}

async function fetchAndSaveBlocksBatch(startBlock, endBlock, batchSize) {
    try {
        for (let block = startBlock; block <= endBlock; block += batchSize) {
            let batchEndBlock = Math.min(block + batchSize - 1, endBlock);
            let batchData = [];

            for (let blockNumber = block; blockNumber <= batchEndBlock; blockNumber++) {
                /*batchData.push({
                    jsonrpc: "2.0",
                    method: "eth_getBlockByNumber",
                    params: ['0x' + blockNumber.toString(16), true], // Include transaction details
                    id: 1
                });*/
                batchData.push(Utils.BlockWithTransactions(blockNumber));
            }
            console.log(`Fetching blocks from ${block} to ${batchEndBlock}`);
            const response = await axios.post(RPC_URL, batchData);
            let blocks = response.data.map(res => res.result).filter(block => block !== null);

            // Save the batch of blocks to a single file
            let filename = `blocks_${block}_${batchEndBlock}.json`;
            fs.writeFileSync(path.join(blockDataDir, filename), JSON.stringify(blocks, null, 2));
            console.log(`Saved blocks from ${block} to ${batchEndBlock}`);
        }
    } catch (err) {
        console.error('Error fetching block data:', err);
    }
}

// Example usage: Fetch and store blocks in batches
const START_BLOCK = 1000000; // Starting block number
const END_BLOCK = 1220000;

// Ending block number
const BATCH_SIZE = 100;       // Number of blocks per batch

fetchAndSaveBlocksBatch(START_BLOCK, END_BLOCK, BATCH_SIZE);
