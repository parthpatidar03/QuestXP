const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

const normalizeEmailError = (error) => {
    if (!error) return 'Failed to send feedback email.';

    if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        return 'Unable to reach the mail provider from the server.';
    }

    if (error.status || error.response?.status) {
        return `Mail provider rejected the request (${error.status || error.response.status}).`;
    }

    return error.message || 'Failed to send feedback email.';
};

const sendWithResend = async ({ to, from, subject, text }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return false;
    }

    if (!from) {
        return false; // Silent skip if from email is missing
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            text,
        }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = new Error(body.message || 'Resend request failed');
        error.status = response.status;
        throw error;
    }

    return true;
};

const sendWithSmtp = async ({ to, from, subject, text }) => {
    const nodemailer = require('nodemailer');
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
        return false;
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    await transporter.verify();
    await transporter.sendMail({ from, to, subject, text });
    return true;
};

// GET all feedback (Admin only)
router.get('/', auth, admin, async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        next(error);
    }
});

// Middleware to optionally attach user info if logged in
const optionalAuth = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const { ACCESS_TOKEN_COOKIE, verifyAccessToken } = require('../utils/authTokens');
        const token = req.cookies[ACCESS_TOKEN_COOKIE];
        if (token) {
            const decoded = verifyAccessToken(token);
            if (decoded && decoded.userId) {
                const user = await User.findById(decoded.userId).select('name email');
                if (user) req.user = user;
            }
        }
    } catch (e) {
        // Silent fail, proceed as guest
    }
    next();
};

router.post(
    '/',
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
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const message = req.body.message;
            const userName = req.user?.name || req.body.name?.trim() || req.body.userName?.trim() || 'Anonymous';
            const userEmail = req.user?.email || req.body.email?.trim() || req.body.userEmail?.trim() || 'Not provided';
            const contextPage = req.body.contextPage || 'unknown';

            // 1. Save to Database (Reliable "In-House" solution)
            const feedback = new Feedback({
                userName,
                userEmail,
                message,
                contextPage
            });
            await feedback.save();

            // 2. Try sending email in background (Optional notification)
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

            // We don't await email so we can respond quickly
            (async () => {
                try {
                    const sentViaResend = await sendWithResend({
                        to: toEmail,
                        from: fromEmail,
                        subject: `[QuestXP Feedback] ${userName}`,
                        text,
                    });

                    if (!sentViaResend) {
                        await sendWithSmtp({
                            to: toEmail,
                            from: process.env.SMTP_FROM || process.env.SMTP_USER,
                            subject: `[QuestXP Feedback] ${userName}`,
                            text,
                        });
                    }
                } catch (e) {
                    console.error('[Feedback Email Error]', e.message);
                }
            })();

            return res.json({ success: true, message: 'Feedback received' });
        } catch (error) {
            return next(error);
        }
    }
);

module.exports = router;
