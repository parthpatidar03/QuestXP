const express = require('express');
const { body } = require('express-validator');
const {
    register, login, googleLogin, getMe, refresh, logout, logoutAll, updateUsername, completeTour,
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const { geoBlock } = require('../middleware/geoBlock');
const {
    checkLockout, recordLoginFailure, recordLoginSuccess, passwordValidator,
} = require('../middleware/security');

const router = express.Router();

// ─── Per-IP throttle (defends brute-force when lockout per-email is bypassed) ─
const buckets = new Map();
const authThrottle = (max, windowMs) => (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const b = buckets.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > b.resetAt) { b.count = 0; b.resetAt = now + windowMs; }
    b.count += 1;
    buckets.set(key, b);
    if (buckets.size > 10000) {
        for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    if (b.count > max) {
        return res.status(429).json({
            error: 'AUTH_RATE_LIMIT',
            message: 'Too many attempts. Please try again in a few minutes.',
        });
    }
    next();
};

const tightThrottle = authThrottle(20, 15 * 60 * 1000);
const looseThrottle = authThrottle(60, 15 * 60 * 1000);

/**
 * Wrap a login-style handler so we can record success/failure to the lockout
 * tracker. We tap into res.status() / res.json() to observe the outcome
 * without modifying the controller.
 */
const trackLoginOutcome = (req, res, next) => {
    const origStatus = res.status.bind(res);
    let statusCode = 200;
    res.status = (c) => { statusCode = c; return origStatus(c); };

    const origJson = res.json.bind(res);
    res.json = (body) => {
        if (statusCode >= 200 && statusCode < 300) {
            recordLoginSuccess(req);
        } else if (statusCode === 400 || statusCode === 401) {
            recordLoginFailure(req);
        }
        return origJson(body);
    };
    next();
};

// ─── Register ───────────────────────────────────────────────────────────────
router.post('/register', tightThrottle, geoBlock, [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    passwordValidator('password'),
], register);

router.post('/signup', tightThrottle, geoBlock, [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    passwordValidator('password'),
], register);

// ─── Login (lockout-protected) ──────────────────────────────────────────────
router.post('/login', tightThrottle, checkLockout, geoBlock, trackLoginOutcome, [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
], login);

router.post('/google', tightThrottle, geoBlock, [
    body('credential').notEmpty().withMessage('Credential is required'),
], googleLogin);

router.get('/me', auth, getMe);
router.post('/refresh', looseThrottle, refresh);
router.post('/logout', looseThrottle, logout);
router.post('/logout-all', auth, logoutAll);
router.patch('/username', auth, updateUsername);
router.patch('/tour-complete', auth, completeTour);

module.exports = router;
