const express = require('express');
const { body } = require('express-validator');
const { createCourse, getCourses, getCourseById, getCourseStatus, addCourseSection } = require('../controllers/courseController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth); // Protect all course routes

// Basic validation for playlistUrl pattern
const youtubePlaylistRegex = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;

router.post('/', [
    body('title').notEmpty().withMessage('Course title is required'),
    body('sections').isArray({ min: 1 }).withMessage('At least one section is required'),
    body('sections.*.title').notEmpty().withMessage('Section title is required'),
    body('sections.*.playlistUrl')
        .matches(youtubePlaylistRegex).withMessage('Valid YouTube playlist URL is required'),
], createCourse);

router.get('/', getCourses);
router.get('/:courseId', getCourseById);
router.get('/:courseId/status', getCourseStatus);

// T062 — Add a new section to an existing ready course
router.patch('/:courseId/sections', [
    body('title').notEmpty().withMessage('Section title is required'),
    body('playlistUrl')
        .matches(youtubePlaylistRegex).withMessage('Valid YouTube playlist URL is required'),
], addCourseSection);

// T033: GET /api/courses/:courseId/progress
router.get('/:courseId/progress', auth, async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: 'Course not found' });

        let totalExpected = 0;
        let totalComplete = 0;

        course.sections.forEach(section => {
            section.lectures.forEach(lecture => {
                const status = lecture.aiStatus;
                // We expect 4 AI tasks per lecture: transcription, notes, quiz, topics
                totalExpected += 4;
                
                ['transcription', 'notes', 'quiz', 'topics'].forEach(task => {
                    // Count 'complete', 'failed', 'skipped' (if added) as done to advance progress bar
                    if (status[task] === 'complete' || status[task] === 'failed') {
                        totalComplete += 1;
                    }
                });
            });
        });

        const percentage = totalExpected === 0 ? 0 : (totalComplete / totalExpected) * 100;

        res.json({ 
            totalExpected, 
            totalComplete, 
            percentage 
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
