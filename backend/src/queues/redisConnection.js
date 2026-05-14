const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    family: 4, // Force IPv4 (Fixes Azure ECONNREFUSED)
    connectTimeout: 10000,
});

module.exports = connection;
