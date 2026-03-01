const User = require('../models/User');
const XPAward = require('../models/XPAward');
const { XP_REWARDS } = require('../constants/xp');
const { STREAK_MULTIPLIERS, LEVELS } = require('../constants/levels');
// badgeService will be implemented in later tasks

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
        const multiplierTier = STREAK_MULTIPLIERS.find(r => currentStreak >= r.minDays) || { multiplier: 1.0 };
        const multiplier = multiplierTier.multiplier;

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

        const prevLevel = user.level;
        const newTotalXP = updatedUser.totalXP;
        const currentLevelObj = [...LEVELS].reverse().find(l => newTotalXP >= l.threshold) || LEVELS[0];
        const newLevel = currentLevelObj.level;

        let leveledUp = false;
        let newLevelTitle = null;
        let levelUps = [];
        let newlyUnlocked = [];

        if (newLevel > prevLevel) {
            leveledUp = true;
            newLevelTitle = currentLevelObj.title;
            levelUps = LEVELS.filter(l => l.level > prevLevel && l.level <= newLevel);
            
            const cumulativeFeatures = LEVELS
                .filter(l => l.level <= newLevel)
                .flatMap(l => l.unlockedFeatures);
            const uniqueFeatures = [...new Set(cumulativeFeatures)];
            newlyUnlocked = levelUps.flatMap(l => l.unlockedFeatures);
            
            updatedUser.level = newLevel;
            updatedUser.unlockedFeatures = uniqueFeatures;
            await updatedUser.save();
        }

        // Build stats for badge checks
        const badgeStats = {
            level: updatedUser.level,
            longestStreak: updatedUser.streak?.longest || 0,
            lecturesCompleted: actionType === 'LECTURE_COMPLETED' ? 
                await XPAward.countDocuments({ user: userId, actionType: 'LECTURE_COMPLETED' }) : 0,
            coursesCompleted: actionType === 'COURSE_COMPLETED' ? 
                await XPAward.countDocuments({ user: userId, actionType: 'COURSE_COMPLETED' }) : 0,
            quizAces: actionType === 'QUIZ_ACED' ? 
                await XPAward.countDocuments({ user: userId, actionType: 'QUIZ_ACED' }) : 0
        };

        const badgeService = require('./badgeService');
        const badgesEarned = await badgeService.checkAndAward(updatedUser, actionType, badgeStats);

        return {
            duplicate: false,
            xpEarned: finalXP,
            baseXP,
            multiplier,
            totalXP: updatedUser.totalXP,
            prevLevel: prevLevel,
            newLevel: newLevel,
            leveledUp,
            newLevelTitle,
            levelUps,
            newlyUnlocked,
            badgesEarned
        };
    }
}

module.exports = new XPService();
