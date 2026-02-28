const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const User = require('../models/User');
const streakService = require('../services/streakService');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const streakWorker = new Worker('streak-reset', async job => {
    try {
        console.log('Running daily streak reset & freeze consumption...');

        // "yesterday" boundary for determining if streak is broken
        // Any lastStudiedDate strictly less than 'yesterday' at 00:00 is considered broken/needs freeze
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const usersAtRisk = await User.find({
            'streak.lastStudiedDate': { $lt: yesterday },
            'streak.current': { $gt: 0 }
        });

        let frozenCount = 0;
        let resetCount = 0;

        for (const user of usersAtRisk) {
            if (user.streak.freezeTokens > 0) {
                // Consume freeze token to preserve streak
                await streakService.consumeFreeze(user._id);
                frozenCount++;
            } else {
                // Break streak
                user.streak.current = 0;
                await user.save();
                resetCount++;
            }
        }

        console.log(`Streak reset job complete: ${frozenCount} frozen, ${resetCount} reset.`);
        return { success: true, frozenCount, resetCount };
    } catch (error) {
        console.error('Streak reset job failed:', error);
        throw error;
    }
}, { connection });

streakWorker.on('completed', job => {
    console.log(`Cron job ${job.id} passed.`);
});
streakWorker.on('failed', (job, err) => {
    console.error(`Cron job ${job.id} failed:`, err.message);
});

module.exports = streakWorker;
