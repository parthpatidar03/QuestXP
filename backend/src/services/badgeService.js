const { BADGES } = require('../constants/badges');

class BadgeService {
    /**
     * Checks and awards badges for a user after an action.
     * @param {Object} user - The Mongoose User document
     * @param {string} actionType - The action that triggered the XP award
     * @param {Object} stats - Aggregated statistics for badge conditions
     * @returns {Array} Array of newly earned badges [{ badgeId, name }]
     */
    async checkAndAward(user, actionType, stats) {
        const newlyEarned = [];
        let updated = false;

        // Ensure user.badges exists
        if (!user.badges) {
            user.badges = [];
        }

        for (const badgeDef of BADGES) {
            // Check if already earned
            const alreadyHas = user.badges.some(b => b.badgeId === badgeDef.id);
            if (!alreadyHas) {
                // If condition met
                if (badgeDef.condition(stats)) {
                    newlyEarned.push({
                        badgeId: badgeDef.id,
                        name: badgeDef.name
                    });
                    
                    user.badges.push({
                        badgeId: badgeDef.id,
                        earnedAt: new Date(),
                        seen: false
                    });
                    updated = true;
                }
            }
        }

        if (updated) {
            await user.save();
        }

        return newlyEarned;
    }
}

module.exports = new BadgeService();
