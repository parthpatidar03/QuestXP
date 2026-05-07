const mongoose = require('mongoose');

const activeWindowSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dayType: { type: String, enum: ['weekday', 'weekend'], required: true },
    bestHourUtc: { type: Number, required: true }, // 0-23
    confidence: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

activeWindowSchema.index({ userId: 1, dayType: 1 }, { unique: true });

module.exports = mongoose.model('ActiveWindow', activeWindowSchema);
