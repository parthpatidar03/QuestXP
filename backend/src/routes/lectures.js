const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const Notes = require('../models/Notes');
const Course = require('../models/Course');

const router = express.Router();

router.use(auth); // Protect all routes in this file

// Feature Gate configs (aligns with levels.js or defaults)
const LEVEL_NOTES_READ = 2;
const LEVEL_NOTES_EDIT = 3;

// T020: GET /api/lectures/:lectureId/notes
router.get('/:lectureId/notes', async (req, res, next) => {
    try {
        // Apply inline featureGate-like logic since req.user is loaded
        if (req.user.level < LEVEL_NOTES_READ) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_NOTES_READ,
                currentLevel: req.user.level
            });
        }

        const lectureId = req.params.lectureId;

        // Check course AI status first to verify if notes are even ready
        const course = await Course.findOne(
            { "sections.lectures._id": lectureId },
            { "sections.$": 1 }
        );

        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const lecture = course.sections[0].lectures.id(lectureId);
        if (lecture.aiStatus.notes !== 'complete') {
            return res.status(404).json({ error: 'Notes not ready yet, status: ' + lecture.aiStatus.notes });
        }

        const notes = await Notes.findOne({ lecture: lectureId }).lean();
        if (!notes) return res.status(404).json({ error: 'Notes missing from DB despite complete status' });

        res.json({ notes });
    } catch (error) {
        next(error);
    }
});

// T021: PATCH /api/lectures/:lectureId/notes/edit
router.patch('/:lectureId/notes/edit', [
    body('content').notEmpty().withMessage('Content cannot be empty')
], async (req, res, next) => {
    try {
        if (req.user.level < LEVEL_NOTES_EDIT) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_NOTES_EDIT,
                currentLevel: req.user.level
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const lectureId = req.params.lectureId;
        const { content } = req.body;

        const updatedNotes = await Notes.findOneAndUpdate(
            { lecture: lectureId },
            { 
                $push: { 
                    userEdits: {
                        userId: req.user._id,
                        content,
                        editedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedNotes) return res.status(404).json({ error: 'Notes not found' });

        res.json({ message: 'Edit saved successfully', notes: updatedNotes });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
