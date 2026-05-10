const express = require('express');
const { body, param } = require('express-validator');
const { 
    createCourse, getCourses, getCourseById, getCourseStatus, 
    addCourseSection, deleteCourse, updateCourse, updateSection,
    getPlaylistInfo, getSharedCourse, cloneCourse
} = require('../controllers/courseController');

const Course = require('../models/Course');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/share/:courseId', getSharedCourse);

router.use(auth); // Protect subsequent course routes

router.post('/share/:courseId/clone', [
    param('courseId').isMongoId().withMessage('Invalid course ID')
], cloneCourse);

router.get('/playlist-info', getPlaylistInfo);

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

router.get('/:courseId', [
    param('courseId').isMongoId().withMessage('Invalid course ID')
], getCourseById);

router.get('/:courseId/status', [
    param('courseId').isMongoId().withMessage('Invalid course ID')
], getCourseStatus);

router.delete('/:courseId', [
    param('courseId').isMongoId().withMessage('Invalid course ID')
], deleteCourse);

// T062 — Add a new section to an existing ready course
router.patch('/:courseId/sections', [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    body('title').notEmpty().withMessage('Section title is required'),
    body('playlistUrl')
        .matches(youtubePlaylistRegex).withMessage('Valid YouTube playlist URL is required'),
], addCourseSection);

router.patch('/:courseId', [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    body('title').notEmpty().withMessage('Course title is required'),
], updateCourse);

router.patch('/:courseId/sections/:sectionId', [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    param('sectionId').isMongoId().withMessage('Invalid section ID'),
    body('title').notEmpty().withMessage('Section title is required'),
], updateSection);

// T033: GET /api/courses/:courseId/progress
router.get('/:courseId/progress', auth, [
    param('courseId').isMongoId().withMessage('Invalid course ID')
], async (req, res, next) => {
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
