const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

const getTransportConfig = () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
        return null;
    }

    return {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    };
};

router.post(
    '/',
    [
        body('message')
            .trim()
            .isLength({ min: 10, max: 2000 })
            .withMessage('Feedback must be between 10 and 2000 characters.'),
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

            const transportConfig = getTransportConfig();
            if (!transportConfig) {
                return res.status(503).json({
                    error: 'Feedback email is not configured on server.',
                });
            }

            const toEmail = process.env.FEEDBACK_TO_EMAIL || 'u1892911@gmail.com';
            const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
            const contextPage = req.body.contextPage || 'unknown';
            const message = req.body.message;
            const userName = req.user?.name || 'Unknown User';
            const userEmail = req.user?.email || 'No email on account';
            const userId = req.user?._id?.toString() || 'unknown';

            const transporter = nodemailer.createTransport(transportConfig);

            const text = [
                'New QuestXP Feedback',
                `User: ${userName}`,
                `Email: ${userEmail}`,
                `User ID: ${userId}`,
                `Page: ${contextPage}`,
                `Submitted At: ${new Date().toISOString()}`,
                '',
                message,
            ].join('\n');

            await transporter.sendMail({
                from: fromEmail,
                to: toEmail,
                subject: `[QuestXP Feedback] ${userName}`,
                text,
            });

            return res.json({ success: true });
        } catch (error) {
            return next(error);
        }
    }
);

module.exports = router;
