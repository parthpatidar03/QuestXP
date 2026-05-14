const { Queue } = require('bullmq');
const connection = require('./redisConnection');

// T028 [P] Add BullMQ retry config
const embeddingQueue = new Queue('embedding', { 
    connection,
    defaultJobOptions: { 
        attempts: 3, 
        backoff: { type: 'exponential', delay: 5000 } 
    }
});

module.exports = embeddingQueue;
