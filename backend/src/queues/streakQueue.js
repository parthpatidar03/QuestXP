const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const streakQueue = new Queue('streak-reset', { connection });

// Schedule midnight cron in IST
streakQueue.add('daily-reset', {}, {
    repeat: { pattern: '0 0 * * *', tz: 'Asia/Kolkata' },
    jobId: 'daily-streak-reset-job' // Ensure only 1 instance exists
});

module.exports = streakQueue;
