/**
 * FriendZone routes — private squads with shared leaderboards & activity feed.
 *
 * Join methods (in priority order):
 *   1. OTP — owner generates a 6-digit code (valid 10 min, single use). Friend
 *      enters it on the invite-link page. Default for new zones.
 *   2. Password — legacy: zones created with a password still accept that
 *      password as a join credential.
 *
 * Security:
 *   - All routes require auth.
 *   - Membership is checked server-side on every read/write.
 *   - Join attempts per-IP throttled in-memory (Redis-independent).
 *   - OTPs and passwords are stored as bcrypt(12) hashes.
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const FriendZone = require('../models/FriendZone');
const User = require('../models/User');
const XPAward = require('../models/XPAward');
const { securityLogger } = require('../utils/logger');

const router = express.Router();
router.use(auth);

// ─── helpers ────────────────────────────────────────────────────────────────

const generateInviteCode = () =>
    crypto.randomBytes(12).toString('base64url').slice(0, 16);

const generateOTP = () => {
    // 6-digit numeric OTP. Use crypto for unbiased range.
    const buf = crypto.randomBytes(3);
    const n = (buf[0] << 16 | buf[1] << 8 | buf[2]) % 1000000;
    return String(n).padStart(6, '0');
};

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const isMember = (zone, userId) =>
    zone.members.some(m => m.toString() === userId.toString());

const isOwner = (zone, userId) =>
    zone.owner.toString() === userId.toString();

const sanitizeZone = (zone) => ({
    _id: zone._id,
    name: zone.name,
    description: zone.description,
    owner: zone.owner,
    memberCount: zone.memberCount,
    maxMembers: zone.maxMembers,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
});

const zoneWithInvite = (zone) => ({
    ...sanitizeZone(zone),
    inviteCode: zone.inviteCode,
});

const otpStatus = (zone) => {
    const o = zone.joinOtp;
    if (!o || !o.codeHash || !o.expiresAt) return { hasActiveOtp: false };
    const expiresAt = new Date(o.expiresAt).getTime();
    if (Date.now() > expiresAt) return { hasActiveOtp: false };
    return { hasActiveOtp: true, expiresAt: o.expiresAt };
};

// In-memory per-IP throttle for join attempts (no Redis dep).
const joinAttempts = new Map();
const JOIN_WINDOW_MS = 15 * 60 * 1000;
const JOIN_MAX = 12;

const throttleJoin = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const bucket = joinAttempts.get(ip) || { count: 0, resetAt: now + JOIN_WINDOW_MS };
    if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + JOIN_WINDOW_MS; }
    bucket.count += 1;
    joinAttempts.set(ip, bucket);
    if (joinAttempts.size > 5000) {
        for (const [k, v] of joinAttempts) if (now > v.resetAt) joinAttempts.delete(k);
    }
    if (bucket.count > JOIN_MAX) {
        return res.status(429).json({ error: 'Too many join attempts. Please wait a few minutes.' });
    }
    next();
};

// ─── POST /api/friendzones — create ─────────────────────────────────────────
// Password is now OPTIONAL. New zones default to OTP-only joining.
router.post('/', [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 chars'),
    body('description').optional().trim().isLength({ max: 200 }),
    body('password').optional().isString().isLength({ min: 4, max: 64 }),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { name, description = '', password } = req.body;
        const passwordHash = password ? await bcrypt.hash(password, 12) : null;

        let zone;
        for (let i = 0; i < 3; i += 1) {
            try {
                zone = await FriendZone.create({
                    name: name.trim(),
                    description: String(description).trim(),
                    owner: req.user._id,
                    inviteCode: generateInviteCode(),
                    passwordHash,
                    members: [req.user._id],
                    memberCount: 1,
                });
                break;
            } catch (err) {
                if (err.code === 11000 && i < 2) continue;
                throw err;
            }
        }

        res.status(201).json({ zone: zoneWithInvite(zone) });
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/friendzones ───────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const zones = await FriendZone.find({ members: req.user._id })
            .sort({ updatedAt: -1 })
            .lean();
        res.json({
            zones: zones.map(z => ({
                ...sanitizeZone(z),
                inviteCode: isOwner(z, req.user._id) ? z.inviteCode : undefined,
                isOwner: isOwner(z, req.user._id),
            })),
        });
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/friendzones/:zoneId — detail + leaderboard + OTP status ──────
router.get('/:zoneId', [
    param('zoneId').isMongoId().withMessage('Invalid zone ID'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const zone = await FriendZone.findById(req.params.zoneId);
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        if (!isMember(zone, req.user._id)) {
            return res.status(403).json({ error: 'Not a member of this zone' });
        }

        const memberDocs = await User.find(
            { _id: { $in: zone.members } },
            'name username totalXP level streak.current geo.country',
        ).lean();

        const youId = req.user._id.toString();
        const leaderboard = memberDocs
            .map(u => ({
                userId: u._id,
                name: u.name,
                username: u.username,
                totalXP: u.totalXP || 0,
                level: u.level || 1,
                streak: u.streak?.current || 0,
                isOwner: zone.owner.toString() === u._id.toString(),
                isYou: u._id.toString() === youId,
            }))
            .sort((a, b) => b.totalXP - a.totalXP)
            .map((m, idx) => ({ ...m, rank: idx + 1 }));

        const owner = isOwner(zone, req.user._id);
        res.json({
            zone: {
                ...sanitizeZone(zone),
                inviteCode: owner ? zone.inviteCode : undefined,
                isOwner: owner,
                hasPassword: !!zone.passwordHash,
                ...(owner ? otpStatus(zone) : {}),
            },
            leaderboard,
        });
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/friendzones/:zoneId/feed ─────────────────────────────────────
router.get('/:zoneId/feed', [
    param('zoneId').isMongoId().withMessage('Invalid zone ID'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const zone = await FriendZone.findById(req.params.zoneId).lean();
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        if (!isMember(zone, req.user._id)) {
            return res.status(403).json({ error: 'Not a member of this zone' });
        }

        const limit = Math.min(Number(req.query.limit) || 30, 100);
        const memberIds = zone.members.map(m => new mongoose.Types.ObjectId(m));

        const awards = await XPAward.find({ user: { $in: memberIds } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        const userIds = [...new Set(awards.map(a => a.user.toString()))];
        const users = await User.find({ _id: { $in: userIds } }, 'name username').lean();
        const userById = new Map(users.map(u => [u._id.toString(), u]));

        const events = awards.map(a => {
            const u = userById.get(a.user.toString());
            return {
                _id: a._id,
                userId: a.user,
                name: u?.name || 'Unknown',
                username: u?.username || null,
                actionType: a.actionType,
                xp: a.finalXP,
                multiplier: a.multiplier,
                at: a.createdAt,
            };
        });

        res.json({ events });
    } catch (err) {
        next(err);
    }
});

// ─── POST /api/friendzones/:zoneId/generate-otp ─────────────────────────────
// Owner only. Mints a fresh 6-digit OTP valid for 10 minutes (single use).
// Returns the plaintext OTP exactly once — caller must show it to the owner.
router.post('/:zoneId/generate-otp', [
    param('zoneId').isMongoId().withMessage('Invalid zone ID'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const zone = await FriendZone.findById(req.params.zoneId);
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        if (!isOwner(zone, req.user._id)) {
            return res.status(403).json({ error: 'Only the owner can generate join codes.' });
        }

        const code = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);
        zone.joinOtp = {
            codeHash: await bcrypt.hash(code, 12),
            expiresAt,
            createdAt: new Date(),
        };
        await zone.save();

        securityLogger.info('Join OTP generated', {
            zoneId: zone._id.toString(),
            ownerId: req.user._id.toString(),
            expiresAt,
        });

        res.json({ code, expiresAt, ttlMs: OTP_TTL_MS });
    } catch (err) {
        next(err);
    }
});

// ─── POST /api/friendzones/peek — preview by inviteCode (login required) ───
// Returns minimal zone metadata + which join methods are accepted so the
// frontend can render the right form.
router.post('/peek', [
    body('inviteCode').isString().trim().isLength({ min: 6, max: 32 }),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const zone = await FriendZone.findOne({ inviteCode: req.body.inviteCode.trim() })
            .select('name description memberCount maxMembers passwordHash joinOtp')
            .lean();
        if (!zone) return res.status(404).json({ error: 'Invite link is invalid or has been revoked.' });

        const otp = otpStatus(zone);
        res.json({
            zone: {
                _id: zone._id,
                name: zone.name,
                description: zone.description || '',
                memberCount: zone.memberCount,
                maxMembers: zone.maxMembers,
                hasPassword: !!zone.passwordHash,
                acceptsOtp: true, // any zone can have an OTP generated by its owner
                ...otp,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── POST /api/friendzones/join — accepts OTP or (legacy) password ─────────
router.post('/join', throttleJoin, [
    body('inviteCode').isString().trim().isLength({ min: 6, max: 32 }),
    body('otp').optional().isString().trim().isLength({ min: 4, max: 12 }),
    body('password').optional().isString().isLength({ min: 1, max: 64 }),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { inviteCode, otp, password } = req.body;
        if (!otp && !password) {
            return res.status(400).json({ error: 'Enter the join code or password.' });
        }

        const zone = await FriendZone.findOne({ inviteCode: inviteCode.trim() });
        if (!zone) {
            return res.status(404).json({ error: 'Invite link is invalid or has been revoked.' });
        }

        if (isMember(zone, req.user._id)) {
            return res.json({ zone: sanitizeZone(zone), alreadyMember: true });
        }

        let credentialOk = false;
        let consumedOtp = false;

        // 1. Try OTP first (preferred).
        if (otp && zone.joinOtp?.codeHash && zone.joinOtp?.expiresAt) {
            if (Date.now() <= new Date(zone.joinOtp.expiresAt).getTime()) {
                credentialOk = await bcrypt.compare(otp, zone.joinOtp.codeHash);
                if (credentialOk) consumedOtp = true;
            }
        }

        // 2. Fall back to legacy password if provided.
        if (!credentialOk && password && zone.passwordHash) {
            credentialOk = await bcrypt.compare(password, zone.passwordHash);
        }

        if (!credentialOk) {
            return res.status(401).json({ error: 'Incorrect code. Ask the owner for a new one.' });
        }

        if (zone.memberCount >= zone.maxMembers) {
            return res.status(409).json({ error: `This zone is full (${zone.maxMembers} members).` });
        }

        zone.members.push(req.user._id);
        zone.memberCount = zone.members.length;

        // Single-use: invalidate the OTP after a successful join.
        if (consumedOtp) {
            zone.joinOtp = { codeHash: null, expiresAt: null, createdAt: null };
        }

        await zone.save();
        res.json({ zone: sanitizeZone(zone) });
    } catch (err) {
        next(err);
    }
});

// ─── leave / kick / delete / regenerate ─────────────────────────────────────
router.post('/:zoneId/leave', [
    param('zoneId').isMongoId().withMessage('Invalid zone ID'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const zone = await FriendZone.findById(req.params.zoneId);
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        if (!isMember(zone, req.user._id)) {
            return res.status(403).json({ error: 'Not a member of this zone' });
        }
        if (isOwner(zone, req.user._id)) {
            return res.status(400).json({
                error: 'Owners cannot leave their zone. Delete it instead.',
                code: 'OWNER_CANNOT_LEAVE',
            });
        }
        zone.members = zone.members.filter(m => m.toString() !== req.user._id.toString());
        zone.memberCount = zone.members.length;
        await zone.save();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.post('/:zoneId/kick/:userId', [
    param('zoneId').isMongoId().withMessage('Invalid zone ID'),
    param('userId').isMongoId().withMessage('Invalid user ID'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const zone = await FriendZone.findById(req.params.zoneId);
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        if (!isOwner(zone, req.user._id)) {
            return res.status(403).json({ error: 'Only the owner can remove members.' });
        }
        if (req.params.userId === zone.owner.toString()) {
            return res.status(400).json({ error: 'Owner cannot kick themselves.' });
        }
        if (!isMember(zone, req.params.userId)) {
            return res.status(404).json({ error: 'User is not a member of this zone.' });
        }
        zone.members = zone.members.filter(m => m.toString() !== req.params.userId);
        zone.memberCount = zone.members.length;
        await zone.save();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.delete('/:zoneId', [
    param('zoneId').isMongoId().withMessage('Invalid zone ID'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const zone = await FriendZone.findById(req.params.zoneId);
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        if (!isOwner(zone, req.user._id)) {
            return res.status(403).json({ error: 'Only the owner can delete this zone.' });
        }
        await FriendZone.deleteOne({ _id: zone._id });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.post('/:zoneId/regenerate-invite', [
    param('zoneId').isMongoId().withMessage('Invalid zone ID'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const zone = await FriendZone.findById(req.params.zoneId);
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        if (!isOwner(zone, req.user._id)) {
            return res.status(403).json({ error: 'Only the owner can regenerate the invite.' });
        }
        zone.inviteCode = generateInviteCode();
        // Also invalidate the current OTP — any code shared along with the old
        // link is no longer useful.
        zone.joinOtp = { codeHash: null, expiresAt: null, createdAt: null };
        await zone.save();
        res.json({ zone: zoneWithInvite(zone) });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
