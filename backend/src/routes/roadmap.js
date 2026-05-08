const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Roadmap = require('../models/Roadmap');
const Course = require('../models/Course');
const { generateRoadmapLogic } = require('../services/roadmapGenerator');

// @route   POST /api/roadmap/generate
// @desc    Generate a new roadmap
router.post('/generate', auth, async (req, res) => {
    try {
        const { playlistIds, dailyHours, startDate, excludedDays } = req.body;

        // 1. Fetch all videos for the selected playlists in order
        const playlists = await Course.find({ _id: { $in: playlistIds } });
        
        let allVideos = [];
        playlists.forEach(pl => {
            pl.sections.forEach(sec => {
                sec.lectures.forEach(lec => {
                    allVideos.push({
                        _id: lec._id,
                        title: lec.title,
                        duration: lec.duration || 10, // fallback
                        playlistId: pl._id,
                        playlistName: pl.title
                    });
                });
            });
        });

        // 2. Run Algorithm
        const roadmapDays = generateRoadmapLogic(allVideos, startDate || new Date(), dailyHours || 2, excludedDays || []);

        // 3. Save to DB (Overwrite existing active roadmap)
        await Roadmap.deleteMany({ userId: req.user.id, status: 'active' });

        const newRoadmap = new Roadmap({
            userId: req.user.id,
            config: {
                playlistIds,
                dailyHours,
                startDate,
                excludedDays
            },
            days: roadmapDays
        });

        await newRoadmap.save();
        res.json(newRoadmap);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/roadmap/current
// @desc    Get active roadmap
router.get('/current', auth, async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({ userId: req.user.id, status: 'active' });
        if (!roadmap) return res.status(404).json({ msg: 'No active roadmap' });
        res.json(roadmap);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
