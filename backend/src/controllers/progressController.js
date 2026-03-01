const { validationResult } = require('express-validator');
const progressService = require('../services/progressService');
const studyPlanService = require('../services/studyPlanService');
const Progress = require('../models/Progress');

const savePosition = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { position, watchedSeconds } = req.body;
        const { courseId, lectureId } = req.params;

        const result = await progressService.savePosition(
            req.user._id,
            courseId,
            lectureId,
            { position, watchedSeconds }
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getProgress = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const progress = await Progress.findOne({ user: req.user._id, course: courseId })
            .select('-__v')
            .lean();

        if (!progress) {
            return res.json({ progress: null });
        }

        res.json({ progress });
    } catch (error) {
        next(error);
    }
};

// ─── Study Plan Handlers (T020, T021, T045, T046) ──────────────────────────

const generateOrRegenPlan = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { courseId } = req.params;
        const { deadline, weekdayCapacityMins, weekendCapacityMins, restDays = [] } = req.body;

        try {
            const plan = await studyPlanService.generatePlan(req.user._id, courseId, {
                deadline,
                weekdayCapacityMins,
                weekendCapacityMins,
                restDays,
                reason: 'manual',
            });

            // T020: 409 if course not ready
            if (plan.courseNotReady) {
                return res.status(409).json({ error: 'COURSE_NOT_READY', message: 'Course is not ready for plan generation' });
            }

            res.status(200).json({ plan });
        } catch (error) {
            // Map service errors to 500 PLAN_ERROR, unless 404
            if (error.status === 404) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'PLAN_ERROR', message: error.message });
        }
    } catch (error) {
        next(error);
    }
};

const getPlan = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const progress = await Progress.findOne({ user: req.user._id, course: courseId });

        // T021: 404 if no plan exists
        if (!progress || !progress.studyPlan) {
            return res.status(404).json({ error: 'PLAN_NOT_FOUND', message: 'No study plan exists for this course' });
        }

        // Trigger dynamic recalculation (idempotent guard inside service)
        const updatedPlan = await studyPlanService.recalculateIfNeeded(req.user._id, courseId, { reason: 'login' });

        res.json({ plan: updatedPlan || progress.studyPlan });
    } catch (error) {
        next(error);
    }
};

const getTodayTarget = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const target = await studyPlanService.getTodayAllocation(req.user._id, courseId);
        
        if (!target) {
            return res.status(404).json({ error: 'PLAN_NOT_FOUND', message: 'No study plan exists for this course' });
        }
        
        res.json({ todayAllocation: target });
    } catch (error) {
        next(error);
    }
};

const getWeeklyTargets = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const weeklyTargets = await studyPlanService.getWeeklyView(req.user._id, courseId);
        
        if (!weeklyTargets) {
            return res.status(404).json({ error: 'PLAN_NOT_FOUND', message: 'No study plan exists for this course' });
        }
        
        res.json({ weeklyTargets });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    savePosition,
    getProgress,
    generateOrRegenPlan,
    getPlan,
    getTodayTarget,
    getWeeklyTargets,
};
