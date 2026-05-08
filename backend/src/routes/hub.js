const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Progress = require('../models/Progress');
const User = require('../models/User');
const Course = require('../models/Course');
const streakService = require('../services/streakService');

router.get('/', (req, res) => res.json({ message: 'Dashboard Root' }));
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
        const progressDocs = await Progress.find({ user: userId });

        // 2. Learning Time (Aggregate StudySessions)
        const StudySession = require('../models/StudySession');
        const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const weeklySessions = await StudySession.find({
            user: userId,
            date: { $gte: sevenDaysAgoStr }
        });

        let weeklySeconds = 0;
        weeklySessions.forEach(s => { weeklySeconds += s.seconds; });

        const totalHours = ((req.user.totalStudyTime || 0) / 3600).toFixed(1);
        const weeklyHours = (weeklySeconds / 3600).toFixed(1);
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
