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
        // Increment visit counter on every hit (freshness)
        const visits = await redis.incr(VISITS_KEY);

        // Try to get from Redis first
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            data.visits = roundUp(visits + 1000, 100); // Add buffered visits to cached data
            return res.json(data);
        }

        // Parallel DB queries
        const [
            userCount,
            quizCount,
            progressResult,
            xpResult
        ] = await Promise.all([
            User.countDocuments(),
            QuizAttempt.countDocuments(),
            Progress.aggregate([{ $group: { _id: null, total: { $sum: "$completedCount" } } }]),
            User.aggregate([{ $group: { _id: null, total: { $sum: "$totalXP" } } }])
        ]);

        const actualMissions = progressResult[0]?.total || 0;
        const actualXP = xpResult[0]?.total || 0;

        // Apply Momentum Buffs & Rounding
        const stats = {
            learners: roundUp(userCount + 20, 10),
            quizzes: roundUp(quizCount + 150, 50),
            missions: roundUp(actualMissions + 500, 100),
            xp: roundUp(actualXP + 50000, 1000),
            visits: roundUp(visits + 1000, 100)
        };

        // Cache in Redis (except visits which is handled separately for real-time)
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stats));

        res.json(stats);
    } catch (err) {
        console.error('[PublicStats] Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
