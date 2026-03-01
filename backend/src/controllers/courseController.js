const { validationResult } = require('express-validator');
const courseService = require('../services/courseService');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const studyPlanService = require('../services/studyPlanService');

const createCourse = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        // Optional inputs from spec for Progress/StudyPlan
        // (deadline, weekdayCapacityMins, weekendCapacityMins)

        const course = await courseService.createCourse(req.user._id, req.body);

        // Spec says T027: validate inputs, call service, return 201 with summary
        res.status(201).json({
            course: {
                _id: course._id,
                title: course.title,
                status: course.status
            }
        });
    } catch (error) {
        next(error);
    }
};

const getCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({ owner: req.user._id })
            .select('title status totalLectures createdAt')
            .sort({ createdAt: -1 })
            .lean();

        // Join completionPct from Progress
        const courseIds = courses.map(c => c._id);
        const progressRecords = await Progress.find({
            user: req.user._id,
            course: { $in: courseIds }
        }).select('course completionPct').lean();

        const progressMap = progressRecords.reduce((map, p) => {
            map[p.course.toString()] = p.completionPct;
            return map;
        }, {});

        const result = courses.map(c => ({
            ...c,
            completionPct: progressMap[c._id.toString()] || 0
        }));

        res.json({ courses: result });
    } catch (error) {
        next(error);
    }
};

const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            owner: req.user._id
        });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        res.json({ course });
    } catch (error) {
        next(error);
    }
};

const getCourseStatus = async (req, res, next) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            owner: req.user._id
        }).select('status sections');

        if (!course) return res.status(404).json({ error: 'Course not found' });

        if (course.status !== 'ready') {
            return res.json({
                status: course.status,
                processedCount: 0,
                totalCount: course.sections.length // Or fallback if we wanna estimate lectures
            });
        }

        const totalLectures = course.sections.reduce((acc, sec) => acc + sec.lectures.length, 0);
        res.json({ status: course.status, processedCount: totalLectures, totalCount: totalLectures });
    } catch (error) {
        next(error);
    }
};

const addCourseSection = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const course = await Course.findOne({
            _id: req.params.courseId,
            owner: req.user._id
        });
        if (!course) return res.status(404).json({ error: 'Course not found' });
        if (course.status !== 'ready') {
            return res.status(409).json({ error: 'Cannot modify course while it is still processing' });
        }

        const { title, playlistUrl } = req.body;
        course.sections.push({ title, playlistUrl, lectures: [] });
        await course.save();

        // TODO: spec-003 — trigger courseProcessor to process new section
        // await courseProcessor.enqueueLectures(course._id);

        // T052b: Wire section-added recalculation
        let newEndDateMessage = null;
        try {
            const planRes = await studyPlanService.recalculateIfNeeded(req.user._id, course._id, { reason: 'section_added' });
            if (planRes && planRes.newEndDateMessage) {
                newEndDateMessage = planRes.newEndDateMessage;
            }
        } catch (err) {
            console.error('[StudyPlan] section added recalc error:', err);
        }

        res.status(201).json({
            message: 'Section added',
            section: course.sections[course.sections.length - 1],
            newEndDateMessage
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    getCourseStatus,
    addCourseSection
};
