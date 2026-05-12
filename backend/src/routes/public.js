const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const redis = require('../queues/redisConnection');

const CACHE_KEY = 'public:stats';
const CACHE_TTL = 600; // 10 minutes

// Helper to round up to nearest interval
const roundUp = (num, interval) => Math.ceil(num / interval) * interval;

router.get('/stats', async (req, res) => {
    try {
        // Try to get from Redis first
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            return res.json(JSON.parse(cached));
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
            xp: roundUp(actualXP + 50000, 1000)
        };

        // Cache in Redis
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stats));

        res.json(stats);
    } catch (err) {
        console.error('[PublicStats] Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
