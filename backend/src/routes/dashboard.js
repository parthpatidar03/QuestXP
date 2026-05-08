const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Progress = require('../models/Progress');
const User = require('../models/User');
const Course = require('../models/Course');
const streakService = require('../services/streakService');

router.use(auth);

/**
 * GET /api/dashboard/stats
 * Aggregates rank, learning time, and nearest deadlines.
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Rank & Leaderboard Context
        const totalUsers = await User.countDocuments();
        const usersSorted = await User.find({}, 'totalXP').sort({ totalXP: -1 });
        const currentRank = usersSorted.findIndex(u => u._id.toString() === userId.toString()) + 1;
        const percentile = totalUsers > 0 ? Math.round(((totalUsers - currentRank) / totalUsers) * 100) : 100;
        
        // Trend (mocked for now as we don't have historical rank snapshots yet)
        const trend = currentRank < 10 ? 'up' : 'stable'; 

        // 2. Learning Time (Aggregate studySessions from all Progress)
        const progressDocs = await Progress.find({ user: userId });
        let totalMins = 0;
        let weeklyMins = 0;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        progressDocs.forEach(p => {
            p.studySessions.forEach(s => {
                totalMins += (s.minutes || 0);
                if (s.date >= sevenDaysAgo) {
                    weeklyMins += (s.minutes || 0);
                }
            });
        });

        // Use the new totalStudyTime field if available (more accurate watch time)
        const totalHours = Math.round((req.user.totalStudyTime || (totalMins * 60)) / 3600);
        const weeklyHours = Math.round((weeklyMins * 60) / 3600);
        const avgPerDay = (weeklyHours / 7).toFixed(1);

        // 3. Course Deadlines
        const activeProgress = progressDocs.filter(p => p.studyPlan?.deadline && !p.studyPlan?.isOverdue);
        let nearestDeadline = null;
        
        if (activeProgress.length > 0) {
            const sortedByDeadline = activeProgress.sort((a, b) => new Date(a.studyPlan.deadline) - new Date(b.studyPlan.deadline));
            const p = sortedByDeadline[0];
            const course = await Course.findById(p.course, 'title');
            
            const daysLeft = Math.ceil((new Date(p.studyPlan.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            
            nearestDeadline = {
                courseTitle: course?.title || 'Unknown Course',
                daysLeft: Math.max(0, daysLeft),
                deadline: p.studyPlan.deadline,
                progress: p.completionPct,
                courseId: p.course
            };
        }

        // 4. Productivity (Completion Rate)
        const completedCourses = progressDocs.filter(p => p.completionPct === 100).length;
        const totalEnrolled = progressDocs.length;
        const completionRate = totalEnrolled > 0 ? Math.round((completedCourses / totalEnrolled) * 100) : 0;

        res.status(200).json({
            rank: {
                current: currentRank,
                trend,
                percentile,
                totalPlayers: totalUsers
            },
            learningTime: {
                totalHours,
                weeklyHours,
                avgPerDay
            },
            deadlines: nearestDeadline,
            productivity: {
                completionRate,
                completedCourses,
                totalEnrolled
            }
        });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
