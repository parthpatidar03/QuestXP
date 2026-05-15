const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const redis = require('../queues/redisConnection');

/**
 * Public landing-page stats.
 *
 * Policy: only REAL counts are returned. Each metric carries a `show` flag
 * that turns true once it crosses a meaningful threshold — until then the
 * landing page hides it. No fake "momentum buffers" are added.
 */

const CACHE_KEY = 'public:stats:v2';
const CACHE_TTL = 60; // 1 minute — real data should feel fresh
const VISITS_KEY = 'public:total_visits';

// Display thresholds. Metric is hidden on the landing page until it crosses
// these values. Tuned so the page doesn't show "5+ active learners".
const THRESHOLDS = {
    learners: 25,
    missions: 100,
    xp: 10000,
    visits: 500,
};

// Round DOWN to a tidy display value so we never overstate the real count.
// "29 users" → "25+", "117 missions" → "100+".
const roundDown = (num, interval) => Math.floor(num / interval) * interval;

const displayValue = (raw, interval) => roundDown(raw, interval);

router.get('/stats', async (req, res) => {
    // Best-effort visit counter — never fail the response on Redis hiccups.
    let visits = 0;
    try {
        visits = await redis.incr(VISITS_KEY);
    } catch (rErr) {
        console.error('[PublicStats] Redis INCR failed:', rErr.message);
    }

    // Cache hit?
    try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            // visits stays live (we just incremented it above)
            data.visits = {
                value: displayValue(visits || 0, 50),
                raw: visits || 0,
                show: (visits || 0) >= THRESHOLDS.visits,
            };
            return res.json(data);
        }
    } catch (rErr) {
        console.error('[PublicStats] Redis GET failed:', rErr.message);
    }

    try {
        const [userCount, quizCount, progressResult, xpResult] = await Promise.all([
            User.countDocuments().catch(() => 0),
            QuizAttempt.countDocuments().catch(() => 0),
            Progress.aggregate([{ $group: { _id: null, total: { $sum: '$completedCount' } } }]).catch(() => []),
            User.aggregate([{ $group: { _id: null, total: { $sum: '$totalXP' } } }]).catch(() => []),
        ]);

        const rawMissions = progressResult[0]?.total || 0;
        const rawXP = xpResult[0]?.total || 0;

        const stats = {
            learners: {
                value: displayValue(userCount, 5),
                raw: userCount,
                show: userCount >= THRESHOLDS.learners,
            },
            quizzes: {
                value: displayValue(quizCount, 10),
                raw: quizCount,
                show: quizCount >= 50,
            },
            missions: {
                value: displayValue(rawMissions, 25),
                raw: rawMissions,
                show: rawMissions >= THRESHOLDS.missions,
            },
            xp: {
                value: displayValue(rawXP, 1000),
                raw: rawXP,
                show: rawXP >= THRESHOLDS.xp,
            },
            visits: {
                value: displayValue(visits || 0, 50),
                raw: visits || 0,
                show: (visits || 0) >= THRESHOLDS.visits,
            },
        };

        // Cache for 1 minute. Visits will still update live on every hit.
        const toCache = { ...stats };
        delete toCache.visits;
        redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(toCache)).catch(() => {});

        res.json(stats);
    } catch (err) {
        console.error('[PublicStats] Fatal Error:', err);
        // Real fallback: everything hidden rather than fake numbers.
        res.json({
            learners: { value: 0, raw: 0, show: false },
            quizzes:  { value: 0, raw: 0, show: false },
            missions: { value: 0, raw: 0, show: false },
            xp:       { value: 0, raw: 0, show: false },
            visits:   { value: 0, raw: 0, show: false },
        });
    }
});

module.exports = router;
