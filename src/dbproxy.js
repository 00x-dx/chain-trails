const knex = require('knex');

class DbProxy {
    constructor(connectionConfig) {
        // Initialize the Knex connection using the provided configuration
        this.db = knex({
            client: 'mysql',
            connection: connectionConfig,
        });
    }

    async bulkWriteBlocks(blocks) {
        for (const block of blocks) {
            try {
                await this.db('blocks')
                    .insert(block)
                    .onConflict('block_number') // Using block_number as the conflict target
                    .merge(); // Merge will update the record if block_number already exists
            } catch (error) {
                console.error('Error in bulkWriteBlocks:', error);
                throw error;
            }
        }
    }

    async bulkWriteTxs(txs) {
        for (const tx of txs) {
            try {
                await this.db('txs')
                    .insert(tx)
                    .onConflict('hash') // Using block_number as the conflict target
                    .merge(); // Merge will update the record if block_number already exists
            } catch (error) {
                console.error('Error in bulkWriteTxs:', error);
                throw error;
            }
        }
    }

    // Additional methods can be added here as needed
}

module.exports = DbProxy;
