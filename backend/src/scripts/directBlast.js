const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const admin = require('../services/firebase');

async function directBlast() {
    try {
        console.log('[DIRECT-BLAST] Connecting to Production DB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing from .env');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        
        const users = await User.find({ fcmToken: { $exists: true, $ne: null } });
        console.log(`[DIRECT-BLAST] Found ${users.length} users with tokens.`);

        for (const user of users) {
            try {
                await admin.messaging().send({
                    token: user.fcmToken,
                    notification: {
                        title: 'QuestXP ⚔️',
                        body: `Hey ${user.name?.split(' ')[0] || 'Warrior'}, your streak is crying! Study now to keep it alive.`
                    }
                });
                console.log(`[SUCCESS] Sent to ${user.email}`);
            } catch (err) {
                console.error(`[FAILED] ${user.email}: ${err.message}`);
            }
        }
        
        console.log('[DIRECT-BLAST] Done.');
        setTimeout(() => process.exit(0), 1000);
    } catch (error) {
        console.error('[DIRECT-BLAST] Fatal Error:', error.message);
        process.exit(1);
    }
}

directBlast();
