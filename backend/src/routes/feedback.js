const express = require('express');
const { body, validationResult } = require('express-validator');

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
        throw new Error('RESEND_API_KEY is set but FEEDBACK_FROM_EMAIL is missing.');
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

            const toEmail = process.env.FEEDBACK_TO_EMAIL || 'u1892911@gmail.com';
            const fromEmail = process.env.FEEDBACK_FROM_EMAIL || '';
            const contextPage = req.body.contextPage || 'unknown';
            const message = req.body.message;
            const userName = req.body.name?.trim() || req.body.userName?.trim() || 'Anonymous';
            const userEmail = req.body.email?.trim() || req.body.userEmail?.trim() || 'Not provided';

            const text = [
                'New QuestXP Feedback',
                `User: ${userName}`,
                `Email: ${userEmail}`,
                `Page: ${contextPage}`,
                `Submitted At: ${new Date().toISOString()}`,
                '',
                message,
            ].join('\n');

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
            } catch (sendError) {
                return res.status(503).json({
                    error: normalizeEmailError(sendError),
                });
            }

            return res.json({ success: true });
        } catch (error) {
            return next(error);
        }
    }
);

module.exports = router;
