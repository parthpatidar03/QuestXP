const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const StudySession = require('../models/StudySession');

// GET /api/public/stats
router.get('/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const courseCount = await Course.countDocuments();
        
        // Sum totalStudyTime from all users
        const totalTimeResult = await User.aggregate([
            { $group: { _id: null, totalSeconds: { $sum: "$totalStudyTime" } } }
        ]);
        const totalSeconds = totalTimeResult[0]?.totalSeconds || 0;
        const totalHours = Math.floor(totalSeconds / 3600);

        res.status(200).json({
            users: userCount,
            courses: courseCount,
            totalHours: totalHours
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
