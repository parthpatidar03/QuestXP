const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
// Controllers will be implemented in later tasks
// const gamificationController = require('../controllers/gamificationController');

// All gamification routes are protected by auth middleware
router.use(auth);

// GET /api/gamification/profile
router.get('/profile', async (req, res) => {
    try {
        const { LEVELS, STREAK_MULTIPLIERS } = require('../constants/levels');
        const { BADGES } = require('../constants/badges');
        const user = req.user;
        
        const currentLevelObj = LEVELS.find(l => l.level === user.level) || LEVELS[0];
        const nextLevelObj = LEVELS.find(l => l.level === user.level + 1);
        
        const currentStreak = user.streak?.current || 0;
        const multiplierTier = STREAK_MULTIPLIERS.find(r => currentStreak >= r.minDays) || { multiplier: 1.0 };
        
        const badgesResponse = BADGES.map(badgeDef => {
            const earnedBadge = user.badges?.find(b => b.badgeId === badgeDef.id);
            return {
                id: badgeDef.id,
                name: badgeDef.name,
                earned: !!earnedBadge,
                earnedAt: earnedBadge ? earnedBadge.earnedAt : null,
                seen: earnedBadge ? earnedBadge.seen : false
            };
        });
        
        const xpInCurrentLevel = user.totalXP - currentLevelObj.threshold;
        const xpNeededForLevel = nextLevelObj ? (nextLevelObj.threshold - currentLevelObj.threshold) : 1000;
        const xpProgress = nextLevelObj ? Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100)) : 100;
        
        res.status(200).json({
            totalXP: user.totalXP,
            level: user.level,
            levelTitle: currentLevelObj.title,
            xpToNextLevel: nextLevelObj ? Math.max(0, nextLevelObj.threshold - user.totalXP) : 0,
            nextLevelXP: nextLevelObj ? nextLevelObj.threshold : user.totalXP,
            xpProgress: Math.round(xpProgress),
            nextLevelTitle: nextLevelObj ? nextLevelObj.title : null,
            streak: {
                current: currentStreak,
                multiplier: multiplierTier.multiplier
            },
            unlockedFeatures: user.unlockedFeatures,
            badges: badgesResponse
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/gamification/xp-history
router.get('/xp-history', async (req, res) => {
    try {
        const XPAward = require('../models/XPAward');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const history = await XPAward.aggregate([
            { $match: { user: req.user._id, createdAt: { $gte: thirtyDaysAgo } } },
            { 
                $group: {
                    _id: { 
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        actionType: "$actionType"
                    },
                    xpEarned: { $sum: "$finalXP" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    totalXP: { $sum: "$xpEarned" },
                    actions: {
                        $push: {
                            actionType: "$_id.actionType",
                            xpEarned: "$xpEarned",
                            count: "$count"
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        const formattedHistory = history.map(day => ({
            date: day._id,
            totalXP: day.totalXP,
            actions: day.actions
        }));
        
        res.status(200).json(formattedHistory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/gamification/badges/seen
router.patch('/badges/seen', async (req, res) => {
    try {
        const user = req.user;
        let markedCount = 0;
        
        if (user.badges && user.badges.length > 0) {
            user.badges.forEach(badge => {
                if (!badge.seen) {
                    badge.seen = true;
                    markedCount++;
                }
            });
            
            if (markedCount > 0) {
                await user.save();
            }
        }
        
        res.status(200).json({ success: true, markedSeen: markedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const { body, validationResult } = require('express-validator');
const xpService = require('../services/xpService');
const { XP_REWARDS } = require('../constants/xp');

// POST /api/gamification/xp
router.post('/xp', [
    body('actionType')
        .isString()
        .isIn(Object.keys(XP_REWARDS))
        .withMessage('Invalid actionType'),
    body('resourceId').optional({ nullable: true }).isMongoId()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { actionType, resourceId } = req.body;
        const awardResponse = await xpService.award(req.user._id, actionType, resourceId);
        res.status(200).json(awardResponse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/gamification/leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { generateRandomUsername } = require('../utils/nameGenerator');
        
        const players = await User.find({}, 'name username usernameSet totalXP level streak')
            .sort({ totalXP: -1 });
        
        const formattedPlayers = await Promise.all(players.map(async (p, i) => {
            let currentUsername = p.username;
            
            // If no username exists, generate a random one and save it
            if (!currentUsername) {
                currentUsername = generateRandomUsername();
                p.username = currentUsername;
                p.usernameSet = false; // Mark as auto-generated
                await p.save();
            }

            return {
                _id: p._id,
                rank: i + 1,
                name: currentUsername,
                displayName: currentUsername,
                totalXP: p.totalXP,
                level: p.level,
                streak: p.streak,
                isMe: p._id.toString() === req.user._id.toString()
            };
        }));
        
        res.status(200).json(formattedPlayers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const StudySession = require('../models/StudySession');

// POST /api/gamification/heartbeat
// Pings periodically to track presence time (default 60s)
router.post('/heartbeat', async (req, res) => {
    try {
        const userId = req.user._id;
        const seconds = parseInt(req.body.seconds) || 60;
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Update User Total
        await User.findByIdAndUpdate(userId, { $inc: { totalStudyTime: seconds } });

        // 2. Update Daily Session
        await StudySession.findOneAndUpdate(
            { user: userId, date: today },
            { $inc: { seconds: seconds }, $set: { lastActive: new Date() } },
            { upsert: true, new: true }
        );

        // 3. Record Activity for Streak
        const streakService = require('../services/streakService');
        await streakService.recordActivity(userId);

        res.json({ success: true, added: seconds });
    } catch (err) {
        console.error('[Heartbeat] error:', err);
        res.status(500).json({ error: 'Failed to record session' });
    }
});

module.exports = router;
