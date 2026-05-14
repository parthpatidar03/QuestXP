const { Queue } = require('bullmq');
const connection = require('./redisConnection');

const streakQueue = new Queue('streak-reset', { connection });

// Schedule midnight cron in IST
streakQueue.add('daily-reset', {}, {
    repeat: { pattern: '0 0 * * *', tz: 'Asia/Kolkata' },
    jobId: 'daily-streak-reset-job' // Ensure only 1 instance exists
});

module.exports = streakQueue;
