const User = require('../models/User');
const { XP_REWARDS } = require('../constants/xp');

const award = async (userId, actionKey, resourceId = null) => {
    const amount = XP_REWARDS[actionKey] || 0;
    if (!amount) return { awarded: 0 };

    // Note: full anti-abuse dedup happens via an XPLog collection in spec 002.
    // For spec 001, we apply the literal XP reward directly to the user record.

    const updatedUser = await User.findByIdAndUpdate(userId, {
        $inc: { totalXP: amount }
    }, { new: true });

    // In a real iteration, we'd also check if the new totalXP crosses a level threshold here,
    // but spec 002 handles level-up logic.

    return { awarded: amount, newTotalXP: updatedUser.totalXP };
};

module.exports = { award };
