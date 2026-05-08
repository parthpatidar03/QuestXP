const mongoose = require('mongoose');
const { Schema } = mongoose;

const studySessionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    seconds: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
});

// Index for fast lookup
studySessionSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StudySession', studySessionSchema);
