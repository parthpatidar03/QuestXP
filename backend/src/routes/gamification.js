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

// POST /api/gamification/xp
router.post('/xp', (req, res) => {
    // Stub
    res.status(200).json({ message: "Award XP stub" });
});

module.exports = router;
