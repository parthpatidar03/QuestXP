const express = require('express');
const router = express.Router();
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
        
        res.status(200).json({
            totalXP: user.totalXP,
            level: user.level,
            levelTitle: currentLevelObj.title,
            xpToNextLevel: nextLevelObj ? Math.max(0, nextLevelObj.threshold - user.totalXP) : 0,
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
router.get('/xp-history', (req, res) => {
    // Stub
    res.status(200).json({ message: "XP history stub" });
});

// PATCH /api/gamification/badges/seen
router.patch('/badges/seen', (req, res) => {
    // Stub
    res.status(200).json({ message: "Badges seen stub" });
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

module.exports = router;
