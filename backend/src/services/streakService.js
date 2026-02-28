const User = require('../models/User');
const xpService = require('./xpService');

const getISTDateString = (date = new Date()) => {
    // Returns YYYY-MM-DD in IST
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const [month, day, year] = new Intl.DateTimeFormat('en-US', options).format(date).split('/');
    return `${year}-${month}-${day}`;
};

const getDaysDifference = (dateStr1, dateStr2) => {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const recordActivity = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return;

    const todayStr = getISTDateString();
    const lastStudiedStr = user.streak?.lastStudiedDate ? getISTDateString(user.streak.lastStudiedDate) : null;

    if (!lastStudiedStr) {
        // First time studying
        user.streak = {
            current: 1,
            longest: 1,
            lastStudiedDate: new Date(),
            freezeTokens: user.streak?.freezeTokens || 0
        };
        await user.save();
        await xpService.award(userId, 'STREAK_DAY');
        return user.streak;
    }

    if (todayStr === lastStudiedStr) {
        // Already studied today
        return user.streak;
    }

    const daysDiff = getDaysDifference(lastStudiedStr, todayStr);

    if (daysDiff === 1) {
        // Consecutive day
        user.streak.current += 1;
        if (user.streak.current > user.streak.longest) {
            user.streak.longest = user.streak.current;
        }
        user.streak.lastStudiedDate = new Date();
        await user.save();
        await xpService.award(userId, 'STREAK_DAY');
    } else if (daysDiff > 1) {
        // Streak broken (freeze tokens will be handled by the midnight cron, so here we just assume it's completely broken if they didn't have freeze tokens consumed)
        user.streak.current = 1;
        user.streak.lastStudiedDate = new Date();
        await user.save();
        await xpService.award(userId, 'STREAK_DAY');
    }

    return user.streak;
};

const consumeFreeze = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.streak || user.streak.freezeTokens <= 0) return false;

    user.streak.freezeTokens -= 1;
    // Don't change current, just update lastStudiedDate as if they studied yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    user.streak.lastStudiedDate = yesterday;

    await user.save();
    return true;
};

module.exports = {
    recordActivity,
    consumeFreeze,
    getISTDateString
};
