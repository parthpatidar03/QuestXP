const mongoose = require('mongoose');
const User = require('../models/User');
const { notificationDeliveryQueue } = require('../queues/notificationQueue');
require('dotenv').config();

async function blast() {
    try {
        console.log('[BLAST] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/questxp');
        
        const users = await User.find({ fcmToken: { $exists: true, $ne: null } });
        
        console.log(`[BLAST] Found ${users.length} users with tokens. Queueing...`);

        for (const user of users) {
            await notificationDeliveryQueue.add('deliverPush', {
                userId: user._id,
                fcmToken: user.fcmToken,
                tone: 'playful',
                text: `Yo ${user.name?.split(' ')[0] || 'Explorer'}! Notifications enabled. 🚀 Now I can pester you to study at the perfect time. Ready to level up?`
            });
            console.log(`[BLAST] Queued for ${user.email}`);
        }
        
        console.log('[BLAST] All jobs added to delivery queue. Workers will process them.');
        setTimeout(() => process.exit(0), 2000);
    } catch (error) {
        console.error('[BLAST] Error:', error);
        process.exit(1);
    }
}

blast();
