const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');

const identifier = process.argv[2];

if (!identifier) {
    console.error('Please provide an email or username: node promoteAdmin.js <email_or_username>');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const user = await User.findOneAndUpdate(
            { 
                $or: [
                    { email: identifier.toLowerCase() },
                    { username: identifier.toLowerCase() }
                ]
            },
            { role: 'admin' },
            { new: true }
        );
        if (user) {
            console.log(`User ${user.email} is now an ADMIN.`);
        } else {
            console.error('User not found.');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
