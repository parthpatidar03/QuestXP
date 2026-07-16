const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Debug: Log Redis connection target (mask password but keep hostname)
const maskedUrl = redisUrl.replace(/:([^@]+)@/, ':****@');
console.log(`[Redis] Connecting to: ${maskedUrl}`);
console.log(`[Redis] REDIS_URL env var exists: ${!!process.env.REDIS_URL}`);

const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    // family: 4, // Removed to allow DNS to resolve naturally (Aiven/Azure fix)
    connectTimeout: 15000, // Slightly longer for Aiven
    retryStrategy(times) {
        const delay = Math.min(times * 500, 5000);
        console.warn(`[Redis-BullMQ] Reconnect attempt #${times}, retrying in ${delay}ms...`);
        return delay;
    },
    enableOfflineQueue: true, // Queue commands while disconnected
    keepAlive: 30000, // TCP keepalive every 30s (Azure/Aiven has ~4min idle timeout)
});

// Manual PING heartbeat to prevent Azure/Aiven idle disconnects
let bullmqPingInterval;
connection.on('connect', () => {
    console.log('[Redis-BullMQ] Connected successfully');
    if (bullmqPingInterval) clearInterval(bullmqPingInterval);
    bullmqPingInterval = setInterval(() => {
        connection.ping().catch(() => {});
    }, 60000); // PING every 60s
});

// Graceful error handling — prevent unhandled error from crashing the process
connection.on('error', (err) => {
    console.error('[Redis-BullMQ] Connection error:', err.message);
});

connection.on('close', () => {
    console.warn('[Redis-BullMQ] Connection closed');
    if (bullmqPingInterval) {
        clearInterval(bullmqPingInterval);
        bullmqPingInterval = null;
    }
});

// Connection for Rate Limiting / Caching (fails fast, enableOfflineQueue: false)
const generalClient = new IORedis(redisUrl, {
    maxRetriesPerRequest: 5,
    connectTimeout: 5000,
    retryStrategy(times) {
        if (times > 3) {
            console.warn(`[Redis-General] Max retry attempts reached, stopping retrying`);
            return null; // Stop retrying, return error
        }
        const delay = Math.min(times * 500, 2000);
        console.warn(`[Redis-General] Reconnect attempt #${times}, retrying in ${delay}ms...`);
        return delay;
    },
    enableOfflineQueue: false, // Fail fast so rate limiter passOnStoreError kicks in immediately
    keepAlive: 30000, // TCP keepalive every 30s (Azure/Aiven has ~4min idle timeout)
});

// Manual PING heartbeat to prevent Azure/Aiven idle disconnects
// (pingInterval is NOT a native ioredis option, so we use setInterval)
let generalPingInterval;
generalClient.on('connect', () => {
    console.log('[Redis-General] Connected successfully');
    // Clear any existing interval before setting a new one
    if (generalPingInterval) clearInterval(generalPingInterval);
    generalPingInterval = setInterval(() => {
        generalClient.ping().catch(() => {}); // Swallow errors, reconnect logic handles them
    }, 60000); // PING every 60s
});

generalClient.on('error', (err) => {
    console.error('[Redis-General] Connection error:', err.message);
});

generalClient.on('close', () => {
    console.warn('[Redis-General] Connection closed');
    if (generalPingInterval) {
        clearInterval(generalPingInterval);
        generalPingInterval = null;
    }
});

module.exports = connection;
module.exports.generalClient = generalClient;
