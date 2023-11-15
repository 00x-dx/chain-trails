const Bull = require('bee-queue');

class Queue {
    constructor(name, url) {
        this.queue = new Bull(name, {
            redis: url
        });
    }

    async addJob(data, opts = {}) {
        return await this.queue.createJob(data).save();
    }

    process(con= 1, processFunction) {
        this.queue.process(con, processFunction);
    }
}

module.exports = { Queue };