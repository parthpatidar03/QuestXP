/**
 * Defensive security middleware bundle.
 *
 *   1. mongoSanitize      — strips Mongo operator keys ($gt, $ne, $where, …)
 *                            and dotted keys from req.body / req.query / req.params.
 *                            Without this, JSON like {"email": {"$ne": null}}
 *                            could turn a findOne() into an unauthenticated
 *                            bypass.
 *
 *   2. blockPrototypeKeys — refuses any request whose JSON contains __proto__,
 *                            prototype, or constructor keys (prototype pollution
 *                            CVE class).
 *
 *   3. loginLockout       — tracks failed login attempts per email AND per IP
 *                            in-memory. Locks for 15 min after 8 consecutive
 *                            failures. Persisted across the request lifecycle
 *                            so credential-stuffing is rate-limited even when
 *                            attackers rotate IPs (per-email check) and even
 *                            when they rotate emails (per-IP check).
 *
 *   4. passwordPolicy     — express-validator chain for new-password fields.
 *                            Requires: min 8 chars, at least one letter and
 *                            one digit. Tunable but conservative.
 */

const { body } = require('express-validator');
const { securityLogger } = require('../utils/logger');

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const sanitizeObject = (obj, depth = 0) => {
    if (depth > 10) return;
    if (obj === null || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
        // Strip Mongo operators ($foo) and dotted keys.
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
            continue;
        }
        sanitizeObject(obj[key], depth + 1);
    }
};

const findDangerousKey = (obj, depth = 0) => {
    if (depth > 10) return null;
    if (obj === null || typeof obj !== 'object') return null;
    for (const key of Object.keys(obj)) {
        if (DANGEROUS_KEYS.has(key)) return key;
        const nested = findDangerousKey(obj[key], depth + 1);
        if (nested) return nested;
    }
    return null;
};

const mongoSanitize = (req, _res, next) => {
    if (req.body)   sanitizeObject(req.body);
    if (req.params) sanitizeObject(req.params);
    // req.query is a getter in newer Express — mutate in place where possible.
    if (req.query)  sanitizeObject(req.query);
    next();
};

const blockPrototypeKeys = (req, res, next) => {
    for (const src of [req.body, req.query, req.params]) {
        const offender = findDangerousKey(src);
        if (offender) {
            securityLogger.warn('Prototype-pollution attempt blocked', {
                requestId: req.requestId,
                ip: req.ip,
                path: req.path,
                offender,
            });
            return res.status(400).json({
                error: 'INVALID_INPUT',
                message: 'Request contains disallowed keys.',
            });
        }
    }
    next();
};

// ─── Login lockout ──────────────────────────────────────────────────────────
const LOCK_THRESHOLD = 8;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const TRACK_WINDOW_MS = 60 * 60 * 1000; // forgive after an hour of no attempts
const emailFailures = new Map(); // email → { count, lastAt }
const ipFailures = new Map();    // ip    → { count, lastAt }

const pruneOld = (map) => {
    const now = Date.now();
    for (const [k, v] of map) {
        if (now - v.lastAt > TRACK_WINDOW_MS) map.delete(k);
    }
};

const isLocked = (entry) => {
    if (!entry) return false;
    return entry.count >= LOCK_THRESHOLD && (Date.now() - entry.lastAt) < LOCK_DURATION_MS;
};

const checkLockout = (req, res, next) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const ip = req.ip || 'unknown';

    if (emailFailures.size > 10000) pruneOld(emailFailures);
    if (ipFailures.size > 10000)    pruneOld(ipFailures);

    const emailEntry = email ? emailFailures.get(email) : null;
    const ipEntry = ipFailures.get(ip);

    if (isLocked(emailEntry) || isLocked(ipEntry)) {
        securityLogger.warn('Login blocked — lockout active', {
            requestId: req.requestId,
            email: email ? `${email.slice(0, 2)}***` : null,
            ip,
        });
        return res.status(429).json({
            error: 'ACCOUNT_LOCKED',
            message: 'Too many failed sign-in attempts. Please try again in 15 minutes.',
        });
    }
    next();
};

const recordLoginFailure = (req) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const ip = req.ip || 'unknown';
    const now = Date.now();
    if (email) {
        const e = emailFailures.get(email) || { count: 0, lastAt: now };
        emailFailures.set(email, { count: e.count + 1, lastAt: now });
    }
    const ipE = ipFailures.get(ip) || { count: 0, lastAt: now };
    ipFailures.set(ip, { count: ipE.count + 1, lastAt: now });
};

const recordLoginSuccess = (req) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const ip = req.ip || 'unknown';
    if (email) emailFailures.delete(email);
    ipFailures.delete(ip);
};

// ─── Password policy ────────────────────────────────────────────────────────
const passwordValidator = (field = 'password') => body(field)
    .isString().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number');

module.exports = {
    mongoSanitize,
    blockPrototypeKeys,
    checkLockout,
    recordLoginFailure,
    recordLoginSuccess,
    passwordValidator,
};
