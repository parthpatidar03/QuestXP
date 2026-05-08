const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Roadmap = require('../models/Roadmap');
const Course = require('../models/Course');
const { generateRoadmapLogic } = require('../services/roadmapGenerator');
const { addDays } = require('date-fns');

// @route   POST /api/roadmap/generate
// @desc    Generate a new roadmap
router.post('/generate', auth, async (req, res) => {
    try {
        const { playlistIds, sectionIds, dailyHours, startDate, courseId } = req.body;

        // 1. Fetch relevant courses
        const playlists = await Course.find({ _id: { $in: playlistIds } });
        
        let allVideos = [];
        playlists.forEach(pl => {
            pl.sections.forEach(sec => {
                // If sectionIds is provided, filter to only include those. Otherwise include all.
                if (!sectionIds || sectionIds.length === 0 || sectionIds.includes(sec._id.toString())) {
                    sec.lectures.forEach(lec => {
                        allVideos.push({
                            _id: lec._id,
                            title: lec.title,
                            duration: lec.duration || 10,
                            playlistId: pl._id,
                            playlistName: pl.title,
                            sectionId: sec._id
                        });
                    });
                }
            });
        });

        const { playlistIds, sectionIds, weekdayHours = 2, weekendHours = 4, startDate, courseId = null } = req.body;

        if (allVideos.length === 0) {
            return res.status(400).json({ msg: 'No videos found for selected content' });
        }

        // 2. Run Algorithm
        const roadmapDays = generateRoadmapLogic(allVideos, startDate || new Date(), weekdayHours, weekendHours, []);

        // 3. Save to DB (Handle global vs course-specific)
        const filter = courseId ? { userId: req.user.id, courseId } : { userId: req.user.id, courseId: null };
        await Roadmap.deleteMany(filter);

        const newRoadmap = new Roadmap({
            userId: req.user.id,
            courseId: courseId || null,
            config: {
                playlistIds,
                sectionIds: sectionIds || [],
                weekdayHours,
                weekendHours,
                startDate,
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
// @desc    Get active roadmap (optional courseId param)
router.get('/current', auth, async (req, res) => {
    try {
        const { courseId } = req.query;
        const filter = { userId: req.user.id, status: 'active' };
        if (courseId) filter.courseId = courseId;
        else filter.courseId = null; // Get global one if no courseId

        const roadmap = await Roadmap.findOne(filter);
        if (!roadmap) return res.status(404).json({ msg: 'No active roadmap' });
        res.json(roadmap);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/roadmap/adjust
// @desc    Shift roadmap start date (Fixes +/- buttons)
router.patch('/adjust', auth, async (req, res) => {
    try {
        const { roadmapId, daysToShift } = req.body;
        const roadmap = await Roadmap.findById(roadmapId);
        if (!roadmap || roadmap.userId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Roadmap not found' });
        }

        // Calculate new start date
        const currentStart = new Date(roadmap.config.startDate);
        const newStart = addDays(currentStart, daysToShift);

        // Fetch videos again to regenerate
        const playlists = await Course.find({ _id: { $in: roadmap.config.playlistIds } });
        let allVideos = [];
        playlists.forEach(pl => {
            pl.sections.forEach(sec => {
                if (!roadmap.config.sectionIds || roadmap.config.sectionIds.length === 0 || roadmap.config.sectionIds.includes(sec._id.toString())) {
                    sec.lectures.forEach(lec => {
                        allVideos.push({
                            _id: lec._id,
                            title: lec.title,
                            duration: lec.duration || 10,
                            playlistId: pl._id,
                            playlistName: pl.title
                        });
                    });
                }
            });
        });

        const weekdayHours = roadmap.config.weekdayHours || roadmap.config.dailyHours || 2;
        const weekendHours = roadmap.config.weekendHours || roadmap.config.dailyHours || 4;

        const roadmapDays = generateRoadmapLogic(allVideos, newStart, weekdayHours, weekendHours, []);
        
        roadmap.config.startDate = newStart;
        roadmap.days = roadmapDays;
        await roadmap.save();

        res.json(roadmap);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
