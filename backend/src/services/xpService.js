const User = require('../models/User');
const XPAward = require('../models/XPAward');
const { XP_REWARDS } = require('../constants/xp');
const { STREAK_MULTIPLIERS } = require('../constants/levels');
// badgeService and level checks will be implemented in later tasks

class XPService {
    /**
     * Award XP to a user for a specific action
     */
    async award(userId, actionType, resourceId = null) {
        if (!XP_REWARDS[actionType]) {
            throw new Error(`Invalid actionType: ${actionType}`);
        }

        const baseXP = XP_REWARDS[actionType];

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // 24 hour window dedup
        const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingAward = await XPAward.findOne({
            user: userId,
            actionType,
            resourceId,
            createdAt: { $gte: windowStart }
        });

        if (existingAward) {
            return {
                duplicate: true,
                xpEarned: 0,
                baseXP,
                multiplier: 1.0,
                totalXP: user.totalXP,
                prevLevel: user.level,
                newLevel: user.level,
                leveledUp: false,
                newLevelTitle: null,
                levelUps: [],
                newlyUnlocked: [],
                badgesEarned: []
            };
        }

        const currentStreak = user.streak?.current || 0;
        const multiplierTier = STREAK_MULTIPLIERS.find(r => currentStreak >= r.minDays);
        const multiplier = multiplierTier ? multiplierTier.multiplier : 1.0;

        const finalXP = Math.round(baseXP * multiplier);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { totalXP: finalXP } },
            { new: true }
        );

        const awardRecord = new XPAward({
            user: userId,
            actionType,
            resourceId,
            baseXP,
            multiplier,
            finalXP
        });
        await awardRecord.save();

        return {
            duplicate: false,
            xpEarned: finalXP,
            baseXP,
            multiplier,
            totalXP: updatedUser.totalXP,
            prevLevel: user.level,
            newLevel: user.level, // Stub
            leveledUp: false,     // Stub
            newLevelTitle: null,  // Stub
            levelUps: [],         // Stub
            newlyUnlocked: [],    // Stub
            badgesEarned: []      // Stub
        };
    }
}

module.exports = new XPService();
