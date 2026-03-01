const mongoose = require('mongoose');
const { Schema } = mongoose;

const xpAwardSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actionType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId, default: null },
    baseXP: { type: Number, required: true },
    multiplier: { type: Number, required: true, default: 1.0 },
    finalXP: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Anti-abuse index: to prevent duplicate awards
xpAwardSchema.index({ user: 1, actionType: 1, resourceId: 1, createdAt: -1 });

// TTL index: auto-cleanup after 30 days (30 * 24 * 60 * 60 = 2592000 seconds)
xpAwardSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('XPAward', xpAwardSchema);
