const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tone: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    opened: { type: Boolean, default: false },
    content: { type: String, required: true }
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
