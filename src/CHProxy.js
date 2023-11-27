require('dotenv').config()
const {createClient} = require("@clickhouse/client")

class CHProxy {
    constructor(config) {
        // read from .env file


        // Take default values from config
        this.dbConfig = {
            host: process.env.DB_HOST || config.host,
            database: process.env.DB_NAME || config.database,
            password: process.env.DB_PASSWORD|| config.password
        };

        console.log(this.dbConfig);

        // Create client
        try {
            this.client = createClient(this.dbConfig);
        } catch (error) {
            console.log(error);
        } finally {
            console.log("Connected to CH");
            console.log(this.client)
        }

        // Assign config
        this.config = config;
    }
    async rowWrite(entry, key) {
        try {
            await this.client.insert({
                table: key,
                values: entry,
                format: 'JSONEachRow'
            })
        } catch (error) {
            console.log('entry = '+entry+'key = ' + key);
            console.log(error);
            console.log("Retrying")
            throw error;
        }
    }
    async bulkWrite(entry, key) {
        try {
            await this.client.insert({
                table: key,
                values: entry,
                format: 'JSONEachRow'
            })
        } catch (error) {
            console.log('entry = '+entry+'key = ' + key);
            console.log("Retrying")
            for(const e of entry) {
                await this.rowWrite(e, key);
            }
            console.log(error)
            throw error;
        }
    }

    async getLastBlockNumber() {
        const query = `SELECT max(block_number) AS last_block_number FROM blocks`;
        const rows = await this. client.query({
            query: query,
            format: 'CSV'
        })
        const result = await rows.text()
        return parseInt(result);
    }

}
module.exports = { CHProxy };