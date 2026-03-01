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

module.exports = router;
