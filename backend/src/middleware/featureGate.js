const levels = require('../constants/levels');

const featureGate = (featureKey) => (req, res, next) => {
    const map = levels.FEATURE_LEVELS || {};
    const required = map[featureKey] || 1;

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.level >= required) {
        return next();
    }

    const requiredLevelObj = levels.LEVELS.find(l => l.level === required) || levels.LEVELS[0];
    const xpToUnlock = Math.max(0, requiredLevelObj.threshold - req.user.totalXP);

    res.status(403).json({
        success: false,
        locked: true,
        featureKey: featureKey,
        requiredLevel: required,
        currentLevel: req.user.level,
        xpToUnlock: xpToUnlock,
        message: `This feature unlocks at Level ${required}`
    });
};

module.exports = featureGate;
