/**
 * /api/logs/client — receives error/warn reports from the React frontend.
 *
 *  - Independent of Redis, Mongo, auth (we WANT logs even when those are down).
 *  - Cheap in-memory rate-limit (per IP) so it can't be used as an abuse vector.
 *  - Truncates oversized payloads.
 *  - Forwards to the standard Winston pipeline as the `CLIENT` subsystem so
 *    frontend errors end up in `combined.log` alongside backend errors.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { clientLogger } = require('../utils/logger');

const router = express.Router();

// Per-IP throttle: 120 logs / 15 min. Generous enough that an angry user
// session can report a lot, tight enough to defeat naive abuse.
const buckets = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 120;

const throttle = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const b = buckets.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
    if (now > b.resetAt) { b.count = 0; b.resetAt = now + WINDOW_MS; }
    b.count += 1;
    buckets.set(ip, b);
    if (buckets.size > 5000) {
        for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    if (b.count > MAX) return res.status(429).json({ error: 'Too many client logs.' });
    next();
};

const truncate = (s, max = 2000) =>
    (typeof s === 'string' && s.length > max) ? s.slice(0, max) + '…[truncated]' : s;

router.post(
    '/client',
    throttle,
    [
        body('level').optional().isIn(['error', 'warn', 'info', 'debug']),
        body('message').isString().isLength({ min: 1, max: 4000 }),
        body('stack').optional().isString().isLength({ max: 8000 }),
        body('url').optional().isString().isLength({ max: 1000 }),
        body('userAgent').optional().isString().isLength({ max: 500 }),
        body('context').optional().isObject(),
        body('clientRequestId').optional().isString().isLength({ max: 64 }),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { level = 'error', message, stack, url, userAgent, context, clientRequestId } = req.body;
        const meta = {
            requestId: req.requestId,
            clientRequestId,
            url: truncate(url, 1000),
            userAgent: truncate(userAgent, 500),
            ip: req.ip,
            context: context || {},
            stack: truncate(stack, 8000),
        };

        clientLogger[level](`(client) ${truncate(message, 2000)}`, meta);
        res.json({ ok: true, requestId: req.requestId });
    }
);

module.exports = router;
