const { Worker } = require('bullmq');
const connection = require('../queues/redisConnection');
const User = require('../models/User');
const NotificationLog = require('../models/NotificationLog');
const { determineTone } = require('../algorithms/notificationEngine');
const { notificationDeliveryQueue } = require('../queues/notificationQueue');
const appUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');

// Mock LLM or template generator
async function generatePushText(user, tone) {
    const templates = {
        playful: `Hey ${user.name}, you opening reels again instead of studying? 👀`,
        sarcastic: `Okay serious question… are we studying today or what 😓`,
        dramatic: `Your streak is fighting for survival rn 💀`,
        passive_aggressive: `We waited. You vanished. 🤡`,
        soft_goodbye: `One last try. If no, we stop. Deal? 🤝`
    };
    return templates[tone] || `Time to learn, ${user.name}!`;
}

// 1. Generator Worker: Decides what to say based on user profile
const generatorWorker = new Worker('notificationGeneratorQueue', async (job) => {
    const { userId } = job.data;
    const user = await User.findById(userId);
    
    if (!user || user.notificationState === 'stopped') return;

    const tone = determineTone(user.lastActive);
    
    // Stop notifications if it's been > 14 days and we already said goodbye
    if (tone === 'soft_goodbye') {
        user.notificationState = 'stopped';
        await user.save();
    }

    const text = await generatePushText(user, tone);

    // Push to delivery queue
    await notificationDeliveryQueue.add('sendPush', {
        userId: user._id,
        fcmToken: user.fcmToken,
        tone,
        text
    });

}, { connection });

const admin = require('../services/firebase');

// 2. Delivery Worker: Actually sends via FCM and logs to DB
const deliveryWorker = new Worker('notificationDeliveryQueue', async (job) => {
    const { userId, fcmToken, tone, text, forceDisplay } = job.data;

    try {
        if (fcmToken && admin.apps?.length > 0) {
            await admin.messaging().send({
                token: fcmToken,
                notification: {
                    title: 'QuestXP',
                    body: text
                },
                webpush: {
                    headers: {
                        Urgency: 'high',
                        TTL: '86400'
                    },
                    fcmOptions: {
                        link: appUrl
                    },
                    notification: {
                        icon: `${appUrl}/favicon.png`,
                        badge: `${appUrl}/favicon.png`
                    }
                },
                data: {
                    tone,
                    url: appUrl,
                    forceDisplay: forceDisplay ? 'true' : 'false'
                }
            });
            console.log(`[PUSH] Sent to ${userId} (${tone}): ${text}`);
        } else {
            console.log(`[PUSH-MOCK] Would send to ${userId} (${tone}): ${text}`);
        }

        // Log it
        await NotificationLog.create({
            userId,
            tone,
            content: text,
            opened: false
        });
    } catch (error) {
        console.error(`[PUSH ERROR] Failed for ${userId}:`, error.message);
        throw error;
    }

}, { connection });

generatorWorker.on('failed', (job, err) => console.error(`Generator error: ${err.message}`));
deliveryWorker.on('failed', (job, err) => console.error(`Delivery error: ${err.message}`));

module.exports = {
    generatorWorker,
    deliveryWorker
};
