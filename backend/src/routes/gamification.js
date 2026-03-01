const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// Controllers will be implemented in later tasks
// const gamificationController = require('../controllers/gamificationController');

// All gamification routes are protected by auth middleware
router.use(auth);

// GET /api/gamification/profile
router.get('/profile', (req, res) => {
    // Stub
    res.status(200).json({ message: "Profile stub" });
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
