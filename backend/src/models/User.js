const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: function () { return !this.googleId; } },
    googleId: { type: String, sparse: true, unique: true },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastStudiedDate: { type: Date, default: null },
        freezeTokens: { type: Number, default: 0 },
    },
    badges: [{ badgeId: String, earnedAt: Date, seen: Boolean }],
    unlockedFeatures: [String],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
