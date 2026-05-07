const cron = require('node-cron');
const ActiveWindow = require('../models/ActiveWindow');
const User = require('../models/User');
const { notificationGeneratorQueue } = require('../queues/notificationQueue');

// Runs every hour to check who needs a push notification
cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Checking active windows for smart notifications...');
    const currentHourUtc = new Date().getUTCHours();
    const dayType = [0, 6].includes(new Date().getUTCDay()) ? 'weekend' : 'weekday';

    try {
        // Find users whose best hour is right now
        const windows = await ActiveWindow.find({ 
            bestHourUtc: currentHourUtc,
            dayType 
        }).populate('userId');

        for (const window of windows) {
            const user = window.userId;
            
            if (!user || user.notificationState === 'stopped') continue;
            
            // Skip if they were active in the last 4 hours (don't spam if they are already studying)
            if (user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < 4 * 60 * 60 * 1000) {
                continue;
            }

            // Enqueue generator job
            await notificationGeneratorQueue.add('generatePush', { userId: user._id });
        }
    } catch (error) {
        console.error('[CRON] Notification scheduler error:', error);
    }
});

// Mock: If we want to simulate the cron manually
async function runSchedulerNow() {
    console.log('[DEBUG] Running notification scheduler manually...');
    const currentHourUtc = new Date().getUTCHours();
    const dayType = [0, 6].includes(new Date().getUTCDay()) ? 'weekend' : 'weekday';

    const windows = await ActiveWindow.find({ 
        bestHourUtc: currentHourUtc,
        dayType 
    }).populate('userId');

    for (const window of windows) {
        const user = window.userId;
        if (!user || user.notificationState === 'stopped') continue;
        await notificationGeneratorQueue.add('generatePush', { userId: user._id });
    }
}

module.exports = { runSchedulerNow };
