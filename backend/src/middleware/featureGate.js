const levels = require('../constants/levels');

const featureGate = (featureKey) => (req, res, next) => {
    const map = levels.FEATURE_LEVELS || {};
    const required = map[featureKey] || 1;

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.level >= required) {
        return next();
    }

    res.status(403).json({
        locked: true,
        requiredLevel: required,
        currentLevel: req.user.level
    });
};

module.exports = featureGate;
