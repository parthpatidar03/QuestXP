const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * FriendZone — a private squad where invited members see each other's
 * progress and compete on a shared leaderboard.
 *
 * Join flow (new): owner generates a short-lived 6-digit OTP on demand;
 * friend opens the invite link, enters the OTP, joins.
 *
 * Legacy zones may still have `passwordHash` set — those keep working with
 * password-based joins for backward compatibility.
 */
const friendZoneSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 60,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200,
        default: '',
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    inviteCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    // Legacy: bcrypt hash of a join password set at zone creation time.
    // New zones won't have this — they use OTP only.
    passwordHash: {
        type: String,
        required: false,
        default: null,
    },
    // Short-lived single-use OTP. Replaces password as the default join method.
    joinOtp: {
        codeHash: { type: String, default: null }, // bcrypt hash of the 6-digit code
        expiresAt: { type: Date, default: null },
        createdAt: { type: Date, default: null },
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    memberCount: {
        type: Number,
        default: 1,
    },
    maxMembers: {
        type: Number,
        default: 20,
        min: 2,
        max: 50,
    },
}, {
    timestamps: true,
});

friendZoneSchema.index({ members: 1 });
friendZoneSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('FriendZone', friendZoneSchema);
