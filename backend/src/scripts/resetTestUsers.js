const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');
const XPAward = require('../models/XPAward');

const testUsers = ['kakashi', 'ram'];

async function resetTestUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        for (const username of testUsers) {
            const user = await User.findOne({ username: username.toLowerCase() });
            
            if (user) {
                console.log(`Found user: ${user.username} (${user.email}). Resetting XP...`);
                
                // 1. Reset User totalXP
                user.totalXP = 0;
                user.level = 1;
                await user.save();

                // 2. Delete XP Awards
                const deletedAwards = await XPAward.deleteMany({ user: user._id });
                console.log(`Reset complete for ${username}. Deleted ${deletedAwards.deletedCount} XP award records.`);
            } else {
                console.log(`User ${username} not found.`);
            }
        }

        console.log('Test users cleanup finished.');
        process.exit(0);
    } catch (err) {
        console.error('Error during reset:', err);
        process.exit(1);
    }
}

resetTestUsers();
