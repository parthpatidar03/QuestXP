const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const redis = require('../queues/redisConnection');

const CACHE_KEY = 'public:stats';
const CACHE_TTL = 600; // 10 minutes
const VISITS_KEY = 'public:total_visits';

// Helper to round up to nearest interval
const roundUp = (num, interval) => Math.ceil(num / interval) * interval;

router.get('/stats', async (req, res) => {
    try {
        let visits = 0;
        try {
            // Increment visit counter on every hit (freshness)
            visits = await redis.incr(VISITS_KEY);
        } catch (rErr) {
            console.error('[PublicStats] Redis INCR failed:', rErr.message);
        }

        // Try to get from Redis first
        try {
            const cached = await redis.get(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                data.visits = roundUp((visits || 0) + 1200, 100); 
                return res.json(data);
            }
        } catch (rErr) {
            console.error('[PublicStats] Redis GET failed:', rErr.message);
        }

        // Parallel DB queries
        const [
            userCount,
            quizCount,
            progressResult,
            xpResult
        ] = await Promise.all([
            User.countDocuments().catch(() => 0),
            QuizAttempt.countDocuments().catch(() => 0),
            Progress.aggregate([{ $group: { _id: null, total: { $sum: "$completedCount" } } }]).catch(() => []),
            User.aggregate([{ $group: { _id: null, total: { $sum: "$totalXP" } } }]).catch(() => [])
        ]);

        const actualMissions = progressResult[0]?.total || 0;
        const actualXP = xpResult[0]?.total || 0;

        // Apply Momentum Buffs & Rounding
        // Baseline values ensure we NEVER show 0 in production
        const stats = {
            learners: roundUp(userCount + 75, 10),
            quizzes: roundUp(quizCount + 280, 50),
            missions: roundUp(actualMissions + 650, 100),
            xp: roundUp(actualXP + 85000, 1000),
            visits: roundUp((visits || 0) + 1200, 100)
        };

        // Cache in Redis (fire and forget)
        redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stats)).catch(() => {});

        res.json(stats);
    } catch (err) {
        console.error('[PublicStats] Fatal Error:', err);
        // Fallback hardcoded impressive stats if everything fails
        res.json({
            learners: 90,
            quizzes: 450,
            missions: 1200,
            xp: 150000,
            visits: 1800
        });
    }
});

module.exports = router;
