const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date, default: null, index: true },
    revokeReason: { type: String, default: null },
}, {
    timestamps: true,
});

sessionSchema.index({ user: 1, revokedAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
