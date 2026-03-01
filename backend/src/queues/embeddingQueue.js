const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// T028 [P] Add BullMQ retry config
const embeddingQueue = new Queue('embedding', { 
    connection,
    defaultJobOptions: { 
        attempts: 3, 
        backoff: { type: 'exponential', delay: 5000 } 
    }
});

module.exports = embeddingQueue;
