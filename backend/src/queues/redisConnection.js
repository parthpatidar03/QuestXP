const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Debug: Log Redis connection target (mask password)
const maskedUrl = redisUrl.replace(/:([^@]+)@/, ':****@');
console.log(`[Redis] Connecting to: ${maskedUrl}`);
console.log(`[Redis] REDIS_URL env var exists: ${!!process.env.REDIS_URL}`);

const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    family: 4, // Force IPv4 (Fixes Azure ECONNREFUSED)
    connectTimeout: 10000,
    retryStrategy(times) {
        const delay = Math.min(times * 500, 5000);
        console.warn(`[Redis] Reconnect attempt #${times}, retrying in ${delay}ms...`);
        return delay;
    },
    enableOfflineQueue: true, // Queue commands while disconnected
});

// Graceful error handling — prevent unhandled error from crashing the process
connection.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
});

connection.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

connection.on('close', () => {
    console.warn('[Redis] Connection closed');
});

module.exports = connection;
