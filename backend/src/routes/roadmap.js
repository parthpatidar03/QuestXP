const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Roadmap = require('../models/Roadmap');
const Course = require('../models/Course');
const progressService = require('../services/progressService');
const Progress = require('../models/Progress');
const { generateRoadmapLogic } = require('../services/roadmapGenerator');
const { addDays } = require('date-fns');

// @route   POST /api/roadmap/generate
// @desc    Generate a new roadmap
router.post('/generate', auth, async (req, res, next) => {
    try {
        const { playlistIds, sectionIds, lectureIds, weekdayHours = 2, weekendHours = 4, startDate, courseId = null } = req.body;

        // 1. Fetch relevant courses (securely)
        const playlists = await Course.find({ _id: { $in: playlistIds }, owner: req.user.id });
        
        if (playlists.length === 0) {
            return res.status(404).json({ msg: 'Selected courses not found' });
        }

        // Check if any course is still processing
        const processing = playlists.filter(p => p.status === 'processing');
        if (processing.length > 0) {
            return res.status(400).json({ 
                msg: `Course "${processing[0].title}" is still processing. Please wait a few seconds and try again.`,
                isProcessing: true 
            });
        }

        let allVideos = [];
        playlists.forEach(pl => {
            pl.sections.forEach(sec => {
                const sectionIdStr = sec._id.toString();
                // If sectionIds is provided, filter to only include those. Otherwise include all.
                if (!sectionIds || sectionIds.length === 0 || sectionIds.some(sid => sid.toString() === sectionIdStr)) {
                    sec.lectures.forEach(lec => {
                        const lectureIdStr = lec._id.toString();
                        // If lectureIds is provided, filter down to individual videos
                        if (!lectureIds || lectureIds.length === 0 || lectureIds.some(lid => lid.toString() === lectureIdStr)) {
                            allVideos.push({
                                _id: lec._id,
                                title: lec.title,
                                duration: lec.duration || 10,
                                playlistId: pl._id,
                                playlistName: pl.title,
                                sectionId: sec._id
                            });
                        }
                    });
                }
            });
        });

        if (allVideos.length === 0) {
            return res.status(400).json({ msg: 'No videos found in selected playlists. Ensure your course generation is complete.' });
        }

        // 2. Run Algorithm
        const roadmapDays = generateRoadmapLogic(allVideos, startDate || new Date(), parseFloat(weekdayHours) || 2, parseFloat(weekendHours) || 4, []);

        // 3. BI-DIRECTIONAL SYNC: Fetch existing progress to mark videos as completed
        const allProgress = await Progress.find({ user: req.user.id });
        const completedLectureIds = new Set();
        allProgress.forEach(p => {
            p.lectureProgress.forEach(lp => {
                if (lp.completed) completedLectureIds.add(lp.lecture.toString());
            });
        });

        // Mark completed in generated days
        roadmapDays.forEach(day => {
            day.plannedVideos.forEach(vid => {
                if (completedLectureIds.has(vid.videoId.toString())) {
                    vid.completed = true;
                }
            });
        });

        // 4. Save to DB (Handle global vs course-specific)
        const filter = courseId ? { userId: req.user.id, courseId } : { userId: req.user.id, courseId: null };
        await Roadmap.deleteMany(filter);

        const roadmapTitle = courseId ? playlists[0].title : "Universal Study Plan";

        const newRoadmap = new Roadmap({
            userId: req.user.id,
            courseId: courseId || null,
            title: roadmapTitle,
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
        next(err);
    }
});

// @route   GET /api/roadmap/current
// @desc    Get active roadmap (optional courseId or roadmapId param)
router.get('/current', auth, async (req, res, next) => {
    try {
        const { courseId, roadmapId } = req.query;
        let filter = { userId: req.user.id, status: 'active' };
        
        if (roadmapId) {
            filter._id = roadmapId;
        } else if (courseId) {
            filter.courseId = courseId;
        } else {
            filter.courseId = null; // Get global one if no courseId
        }

        const roadmap = await Roadmap.findOne(filter).sort({ createdAt: -1 });
        if (!roadmap) {
            return res.status(404).json({ msg: 'No active roadmap' });
        }

        // BI-DIRECTIONAL SYNC: Ensure roadmap is up-to-date with current progress
        const allProgress = await Progress.find({ user: req.user.id });
        const completedLectureIds = new Set();
        allProgress.forEach(p => {
            p.lectureProgress.forEach(lp => {
                if (lp.completed) completedLectureIds.add(lp.lecture.toString());
            });
        });

        let changed = false;
        roadmap.days.forEach(day => {
            day.plannedVideos.forEach(vid => {
                const isNowCompleted = completedLectureIds.has(vid.videoId.toString());
                if (vid.completed !== isNowCompleted) {
                    vid.completed = isNowCompleted;
                    changed = true;
                }
            });
        });

        if (changed) {
            await roadmap.save();
        }

        res.json(roadmap);
    } catch (err) {
        next(err);
    }
});

// @route   PATCH /api/roadmap/adjust
// @desc    Shift roadmap start date (Fixes +/- buttons)
router.patch('/adjust', auth, async (req, res, next) => {
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
        next(err);
    }
});

// @route   PATCH /api/roadmap/shift-partial
// @desc    Shift roadmap from a specific day index onwards
router.patch('/shift-partial', auth, async (req, res, next) => {
    try {
        const { roadmapId, fromDayIndex, shiftAmount } = req.body;
        const roadmap = await Roadmap.findById(roadmapId);
        if (!roadmap || roadmap.userId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Roadmap not found' });
        }

        // 1. Identify videos to keep (before the shift) and videos to move (at/after shift)
        const daysToKeep = roadmap.days.slice(0, fromDayIndex);
        const videosToMove = [];
        for (let i = fromDayIndex; i < roadmap.days.length; i++) {
            videosToMove.push(...roadmap.days[i].plannedVideos);
        }

        if (videosToMove.length === 0 && shiftAmount < 0) {
            // Nothing to move back
            return res.json(roadmap);
        }

        // 2. Calculate new start date for the moving block
        let anchorDate;
        if (fromDayIndex === 0) {
            anchorDate = new Date(roadmap.config.startDate);
        } else {
            anchorDate = new Date(roadmap.days[fromDayIndex].date);
        }
        const newBlockStartDate = addDays(anchorDate, shiftAmount);

        // 3. Re-fetch video details
        const playlists = await Course.find({ _id: { $in: roadmap.config.playlistIds } });
        let videoMap = new Map();
        playlists.forEach(pl => {
            pl.sections.forEach(sec => {
                sec.lectures.forEach(lec => {
                    videoMap.set(lec._id.toString(), {
                        _id: lec._id,
                        title: lec.title,
                        duration: lec.duration || 10,
                        playlistId: pl._id,
                        playlistName: pl.title
                    });
                });
            });
        });

        const videosToProcess = videosToMove.map(v => videoMap.get(v.videoId.toString())).filter(Boolean);

        // 4. Regenerate the partial roadmap
        const weekdayHours = roadmap.config.weekdayHours || 2;
        const weekendHours = roadmap.config.weekendHours || 4;
        
        const newPartialDays = generateRoadmapLogic(
            videosToProcess, 
            newBlockStartDate, 
            weekdayHours, 
            weekendHours, 
            []
        );

        // Update day indices
        const startIdx = daysToKeep.length;
        newPartialDays.forEach((day, i) => {
            day.dayIndex = startIdx + i;
        });

        roadmap.days = [...daysToKeep, ...newPartialDays];
        
        // If we shifted the very first day, update config
        if (fromDayIndex === 0) {
            roadmap.config.startDate = newBlockStartDate;
        }

        await roadmap.save();
        res.json(roadmap);
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/roadmap/all
// @desc    Get all active roadmaps for user
router.get('/all', auth, async (req, res, next) => {
    try {
        const roadmaps = await Roadmap.find({ userId: req.user.id, status: 'active' }).sort({ updatedAt: -1 });
        res.json(roadmaps);
    } catch (err) {
        next(err);
    }
});

// @route   PATCH /api/roadmap/:roadmapId/title
// @desc    Update roadmap title
router.patch('/:roadmapId/title', auth, async (req, res, next) => {
    try {
        const { title } = req.body;
        const roadmap = await Roadmap.findOne({ _id: req.params.roadmapId, userId: req.user.id });
        if (!roadmap) return res.status(404).json({ msg: 'Roadmap not found' });

        roadmap.title = title;
        await roadmap.save();
        res.json(roadmap);
    } catch (err) {
        next(err);
    }
});

// @route   DELETE /api/roadmap/:roadmapId
// @desc    Delete a roadmap
router.delete('/:roadmapId', auth, async (req, res, next) => {
    try {
        const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.roadmapId, userId: req.user.id });
        if (!roadmap) return res.status(404).json({ msg: 'Roadmap not found' });
        res.json({ msg: 'Roadmap deleted' });
    } catch (err) {
        next(err);
    }
});

// @route   PATCH /api/roadmap/:roadmapId/video/:videoId/complete
// @desc    Toggle video completion in roadmap (bi-directional sync with Progress)
router.patch('/:roadmapId/video/:videoId/complete', auth, async (req, res, next) => {
    try {
        const { roadmapId, videoId } = req.params;
        const wantCompleted = Boolean(req.body?.completed);

        const roadmap = await Roadmap.findOne({ _id: roadmapId, userId: req.user.id });
        if (!roadmap) {
            return res.status(404).json({ msg: 'Roadmap not found' });
        }

        // Locate the video and its owning course in this roadmap.
        let targetPlaylistId = null;
        let videoFound = false;
        for (const day of roadmap.days) {
            for (const vid of day.plannedVideos) {
                if (vid.videoId.toString() === videoId) {
                    targetPlaylistId = vid.playlistId;
                    videoFound = true;
                    break;
                }
            }
            if (videoFound) break;
        }
        if (!videoFound) {
            return res.status(404).json({ msg: 'Video not found in roadmap' });
        }

        const courseId = roadmap.courseId || targetPlaylistId;
        if (!courseId) {
            return res.status(400).json({ msg: 'Unable to resolve course for video' });
        }

        // 1. Update Progress (source of truth). If this fails, do NOT touch the roadmap.
        let progressResult;
        try {
            progressResult = await progressService.toggleLecture(
                req.user.id,
                courseId,
                videoId,
                wantCompleted
            );
        } catch (toggleErr) {
            return res.status(500).json({
                msg: 'Failed to update progress',
                error: toggleErr.message,
            });
        }

        // 2. Sync the roadmap document's `completed` flags from the
        //    canonical Progress state so the response is never stale.
        const allProgress = await Progress.find({ user: req.user.id });
        const completedIds = new Set();
        allProgress.forEach(p => {
            p.lectureProgress.forEach(lp => {
                if (lp.completed) completedIds.add(lp.lecture.toString());
            });
        });

        let mutated = false;
        roadmap.days.forEach(day => {
            day.plannedVideos.forEach(v => {
                const shouldBe = completedIds.has(v.videoId.toString());
                if (v.completed !== shouldBe) {
                    v.completed = shouldBe;
                    mutated = true;
                }
            });
        });
        if (mutated) await roadmap.save();

        res.json({ roadmap, progress: progressResult });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
