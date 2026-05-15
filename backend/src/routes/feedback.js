/**
 * Feedback route — designed to be INDEPENDENT of every other subsystem.
 *
 * Contract:
 *  - Never depends on the global Redis rate limiter (mounted BEFORE it in app.js).
 *  - Never requires authentication. Auth is best-effort attached if available.
 *  - Database save failures do NOT cause the user-facing request to fail.
 *    We log the error and still return 200 so the user sees "Feedback received".
 *  - Email delivery is fully async and never affects the response.
 *  - In-memory per-IP rate limit (no external dependency).
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// ─── In-memory rate limiter (no Redis dependency) ────────────────────────────
// 30 submissions / hour / IP. Cheap, resilient.
const FEEDBACK_WINDOW_MS = 60 * 60 * 1000;
const FEEDBACK_MAX = 30;
const ipBucket = new Map();

const inMemoryRateLimit = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const bucket = ipBucket.get(ip) || { count: 0, resetAt: now + FEEDBACK_WINDOW_MS };
    if (now > bucket.resetAt) {
        bucket.count = 0;
        bucket.resetAt = now + FEEDBACK_WINDOW_MS;
    }
    bucket.count += 1;
    ipBucket.set(ip, bucket);

    // Periodic prune so the map cannot grow unbounded
    if (ipBucket.size > 10000) {
        for (const [key, val] of ipBucket) {
            if (now > val.resetAt) ipBucket.delete(key);
        }
    }

    if (bucket.count > FEEDBACK_MAX) {
        return res.status(429).json({
            success: false,
            error: 'Too many feedback submissions. Please try again later.',
        });
    }
    next();
};

// ─── Email transports (best-effort, never throw to caller) ──────────────────
const sendWithResend = async ({ to, from, subject, text }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !from) return false;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ from, to: [to], subject, text }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = new Error(body.message || `Resend failed (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return true;
};

const sendWithSmtp = async ({ to, from, subject, text }) => {
    let nodemailer;
    try { nodemailer = require('nodemailer'); } catch { return false; }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) return false;

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.verify();
    await transporter.sendMail({ from, to, subject, text });
    return true;
};

// Fire-and-forget email delivery
const deliverEmailAsync = (payload) => {
    setImmediate(async () => {
        try {
            const sent = await sendWithResend(payload);
            if (!sent) {
                await sendWithSmtp({
                    ...payload,
                    from: process.env.SMTP_FROM || process.env.SMTP_USER || payload.from,
                });
            }
        } catch (e) {
            console.error('[Feedback Email Error]', e.message);
        }
    });
};

// ─── Optional auth: attach user info if logged in, never block on failure ───
const optionalAuth = async (req, _res, next) => {
    try {
        const User = require('../models/User');
        const { ACCESS_TOKEN_COOKIE, verifyAccessToken } = require('../utils/authTokens');
        const token = req.cookies?.[ACCESS_TOKEN_COOKIE]
            || (req.headers.authorization?.startsWith('Bearer ')
                ? req.headers.authorization.split(' ')[1]
                : null);
        if (token) {
            const decoded = verifyAccessToken(token);
            if (decoded?.userId) {
                const user = await User.findById(decoded.userId).select('name email');
                if (user) req.user = user;
            }
        }
    } catch {
        // Silent — feedback must work for guests and even with auth subsystem down
    }
    next();
};

// ─── Admin: list all feedback ────────────────────────────────────────────────
router.get('/', auth, admin, async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        next(error);
    }
});

// ─── Public: submit feedback ─────────────────────────────────────────────────
router.post(
    '/',
    inMemoryRateLimit,
    optionalAuth,
    [
        body('message')
            .trim()
            .isLength({ min: 5, max: 2000 })
            .withMessage('Feedback must be between 5 and 2000 characters.'),
        body('contextPage')
            .optional()
            .trim()
            .isLength({ max: 120 })
            .withMessage('contextPage must be at most 120 characters.'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Sanitize string inputs defensively (avoid MongoDB operator injection)
        const sanitize = (v) => (typeof v === 'string' ? v : '');
        const message = sanitize(req.body.message).trim();
        const userName = req.user?.name
            || sanitize(req.body.name).trim()
            || sanitize(req.body.userName).trim()
            || 'Anonymous';
        const userEmail = req.user?.email
            || sanitize(req.body.email).trim()
            || sanitize(req.body.userEmail).trim()
            || 'Not provided';
        const contextPage = sanitize(req.body.contextPage).trim() || 'unknown';

        // 1. Best-effort DB save — failure is non-fatal
        try {
            const feedback = new Feedback({ userName, userEmail, message, contextPage });
            await feedback.save();
        } catch (dbErr) {
            console.error('[Feedback DB Save Failed — non-fatal]', dbErr.message);
        }

        // 2. Fire-and-forget email
        const toEmail = process.env.FEEDBACK_TO_EMAIL || 'u1892911@gmail.com';
        const fromEmail = process.env.FEEDBACK_FROM_EMAIL || '';
        const text = [
            'New QuestXP Feedback',
            `User: ${userName}`,
            `Email: ${userEmail}`,
            `Page: ${contextPage}`,
            `Submitted At: ${new Date().toISOString()}`,
            '',
            message,
        ].join('\n');

        deliverEmailAsync({
            to: toEmail,
            from: fromEmail,
            subject: `[QuestXP Feedback] ${userName}`,
            text,
        });

        // 3. Always respond success — feedback should "always work"
        return res.json({ success: true, message: 'Feedback received' });
    }
);

module.exports = router;
