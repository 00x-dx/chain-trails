const mysql = require('mysql');

// Array of your data objects
const dataArray = [
    {
        "block_number": 1000468,
        // ... (rest of your JSON data for first object)
    },
    {
        "block_number": 1000469,
        // ... (rest of your JSON data for second object)
    },
    // ... (more objects)
];

class DB {
    constructor() {
        this.connection = mysql.createConnection({
            host: 'localhost', // Your database host
            user: 'root', // Your database username
            password: 'mysql', // Your database password
            database: 'mainnet' // Your database name
        });

    }

    static saveBatch(dataArray) {

    }
}