const express = require('express');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const Notes = require('../models/Notes');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Transcript = require('../models/Transcript');
const EmbeddingStatus = require('../models/EmbeddingStatus');
const xpService = require('../services/xpService');
const progressService = require('../services/progressService');
const { aiRouteLogger, attachUserIdToLog } = require('../middleware/aiLogger');

const router = express.Router();

router.use(auth);
router.use(attachUserIdToLog);
router.use(aiRouteLogger);

// Level gates (kept loose — they were preventing legitimate access in prod)
const LEVEL_NOTES_READ = 1;
const LEVEL_NOTES_EDIT = 3;
const LEVEL_QUIZ = 1;

const { quizLimiter, summaryLimiter } = require('../middleware/rateLimiter');

// T020: GET /api/lectures/:lectureId/notes — fetch generated summary
router.get('/:lectureId/notes', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        if ((req.user.level ?? 1) < LEVEL_NOTES_READ) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_NOTES_READ,
                currentLevel: req.user.level,
            });
        }

        const lectureId = req.params.lectureId;

        const course = await Course.findOne(
            { 'sections.lectures._id': lectureId },
            { 'sections.$': 1 }
        );
        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const lecture = course.sections[0].lectures.id(lectureId);
        if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

        if (lecture.aiStatus?.notes !== 'complete') {
            return res.status(404).json({
                error: `Notes not ready yet (status: ${lecture.aiStatus?.notes || 'pending'})`,
                status: lecture.aiStatus?.notes || 'pending',
            });
        }

        const notes = await Notes.findOne({ lecture: lectureId }).lean();
        if (!notes) return res.status(404).json({ error: 'Notes missing from DB' });

        res.json({ notes });
    } catch (error) {
        next(error);
    }
});

// T021: PATCH /api/lectures/:lectureId/notes/edit — add user edit to notes
router.patch('/:lectureId/notes/edit', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID'),
    body('content').notEmpty().withMessage('Content cannot be empty').isLength({ max: 5000 }),
], async (req, res, next) => {
    try {
        if ((req.user.level ?? 1) < LEVEL_NOTES_EDIT) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_NOTES_EDIT,
                currentLevel: req.user.level,
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
                        content: String(content).slice(0, 5000),
                        editedAt: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!updatedNotes) return res.status(404).json({ error: 'Notes not found' });
        res.json({ message: 'Edit saved successfully', notes: updatedNotes });
    } catch (error) {
        next(error);
    }
});

// T025: GET /api/lectures/:lectureId/topics
router.get('/:lectureId/topics', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const lectureId = req.params.lectureId;

        const course = await Course.findOne(
            { 'sections.lectures._id': lectureId },
            { 'sections.$': 1 }
        );
        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const lecture = course.sections[0].lectures.id(lectureId);
        if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

        if (lecture.aiStatus.topics === 'pending' || lecture.aiStatus.topics === 'in_progress') {
            return res.status(404).json({ error: 'Topics not ready yet' });
        }
        if (lecture.aiStatus.topics === 'failed') {
            return res.json({ success: true, topics: [] });
        }
        const topics = [...(lecture.topics || [])].sort((a, b) => a.startTime - b.startTime);
        res.json({ topics });
    } catch (error) {
        next(error);
    }
});

// T029: GET /api/lectures/:lectureId/quiz
router.get('/:lectureId/quiz', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        if ((req.user.level ?? 1) < LEVEL_QUIZ) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_QUIZ,
                currentLevel: req.user.level,
            });
        }

        const lectureId = req.params.lectureId;
        const course = await Course.findOne(
            { 'sections.lectures._id': lectureId },
            { 'sections.$': 1 }
        );
        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const lecture = course.sections[0].lectures.id(lectureId);
        if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

        if (lecture.aiStatus.quiz !== 'complete') {
            return res.status(404).json({ error: 'Quiz not ready yet' });
        }

        const quiz = await Quiz.findOne({ lecture: lectureId }).lean();
        if (!quiz) return res.status(404).json({ error: 'Quiz missing' });

        const questionsWithoutAnswers = quiz.questions.map(q => {
            const { correctIndex, correctIndices, ...rest } = q;
            return rest;
        });
        res.json({ quiz: { ...quiz, questions: questionsWithoutAnswers } });
    } catch (error) {
        next(error);
    }
});

// T030: POST /api/lectures/:lectureId/quiz/submit
router.post('/:lectureId/quiz/submit', [
    quizLimiter,
    param('lectureId').isMongoId().withMessage('Invalid lecture ID'),
    body('answers').isArray().withMessage('Answers must be an array'),
    body('timeTakenSecs').isNumeric({ min: 0 }).withMessage('Valid time taken is required'),
], async (req, res, next) => {
    try {
        if ((req.user.level ?? 1) < LEVEL_QUIZ) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_QUIZ,
                currentLevel: req.user.level,
            });
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const lectureId = req.params.lectureId;
        const { answers, timeTakenSecs } = req.body;

        const quiz = await Quiz.findOne({ lecture: lectureId }).lean();
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

        if (answers.length !== quiz.questionCount) {
            return res.status(400).json({ error: `Expected ${quiz.questionCount} answers` });
        }

        let correctCount = 0;
        const evaluatedQuestions = quiz.questions.map((q, idx) => {
            const userAnswers = answers[idx];
            const correctIndices = q.correctIndices || (q.correctIndex !== undefined ? [q.correctIndex] : []);
            let isCorrect = false;
            if (Array.isArray(userAnswers)) {
                isCorrect = userAnswers.length === correctIndices.length &&
                            userAnswers.every(val => correctIndices.includes(val));
            } else if (typeof userAnswers === 'number') {
                isCorrect = correctIndices.length === 1 && correctIndices[0] === userAnswers;
            }
            if (isCorrect) correctCount++;
            return { ...q, userAnswer: userAnswers, isCorrect };
        });

        const score = Math.round((correctCount / quiz.questionCount) * 100);

        const priorAttempts = await QuizAttempt.find({ user: req.user._id, lecture: lectureId })
            .sort({ score: -1 }).lean();
        const personalBest = priorAttempts.length > 0 ? priorAttempts[0].score : 0;
        const isNewPersonalBest = priorAttempts.length > 0 && score > personalBest;
        const attemptNumber = priorAttempts.length + 1;

        const attempt = await QuizAttempt.create({
            user: req.user._id,
            lecture: lectureId,
            answers,
            score,
            timeTakenSecs,
            attemptNumber,
        });

        await xpService.award(req.user._id, 'QUIZ_ATTEMPTED', attempt._id.toString());
        if (score >= 60) await xpService.award(req.user._id, 'QUIZ_PASSED', attempt._id.toString());
        if (score === 100) await xpService.award(req.user._id, 'QUIZ_ACED', attempt._id.toString());

        const courseLookup = await Course.findOne({ 'sections.lectures._id': lectureId }, { _id: 1 });
        let progressResult = null;
        if (courseLookup) {
            progressResult = await progressService.toggleLecture(req.user._id, courseLookup._id.toString(), lectureId, true);
        }

        res.json({
            score,
            correctCount,
            totalCount: quiz.questionCount,
            isNewPersonalBest,
            attemptNumber,
            evaluatedQuestions,
            progress: progressResult,
        });
    } catch (error) {
        next(error);
    }
});

// T032: GET /api/lectures/:lectureId/ai-status
router.get('/:lectureId/ai-status', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const lectureId = req.params.lectureId;
        const course = await Course.findOne(
            { 'sections.lectures._id': lectureId },
            { 'sections.$': 1 }
        );
        if (!course) return res.status(404).json({ error: 'Lecture not found' });
        const lecture = course.sections[0].lectures.id(lectureId);
        if (!lecture) return res.status(404).json({ error: 'Lecture not found' });
        res.json({ aiStatus: lecture.aiStatus });
    } catch (error) {
        next(error);
    }
});

const notesQueue = require('../queues/notesQueue');
const quizQueue = require('../queues/quizQueue');
const transcriptionQueue = require('../queues/transcriptionQueue');
const jobOptions = require('../queues/jobOptions');

/**
 * Helper: ensure the lecture has been transcribed (or is in flight). If not,
 * enqueue the transcription job so downstream notes/quiz can proceed.
 * Used by both `summary/generate` and `quiz/generate` so the user never has to
 * "kick" the pipeline manually.
 */
const ensureTranscription = async (course, lectureId, targetLecture) => {
    const status = targetLecture?.aiStatus?.transcription;
    if (status === 'complete' || status === 'in_progress') return;

    await Course.findOneAndUpdate(
        { _id: course._id, 'sections.lectures._id': lectureId },
        { $set: { 'sections.$[].lectures.$[lec].aiStatus.transcription': 'pending' } },
        { arrayFilters: [{ 'lec._id': lectureId }] }
    );

    await transcriptionQueue.add('transcribe', {
        courseId: course._id.toString(),
        lectureId,
        youtubeId: targetLecture.youtubeId,
        durationSecs: targetLecture.duration,
    }, jobOptions);
};

const findLectureInCourse = (course, lectureId) => {
    for (const section of course.sections) {
        const lec = section.lectures.id(lectureId);
        if (lec) return lec;
    }
    return null;
};

// T033: POST /api/lectures/:lectureId/summary/generate
router.post('/:lectureId/summary/generate', summaryLimiter, [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const lectureId = req.params.lectureId;
        const course = await Course.findOne({ 'sections.lectures._id': lectureId });
        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const targetLecture = findLectureInCourse(course, lectureId);
        if (!targetLecture) return res.status(404).json({ error: 'Lecture not found' });

        // Ensure transcription has fired (no-op if already running/done)
        await ensureTranscription(course, lectureId, targetLecture);

        // Reset notes status and queue
        await Course.findOneAndUpdate(
            { _id: course._id, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.notes': 'pending' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );
        await notesQueue.add('generate-notes', { lectureId, courseId: course._id.toString() }, jobOptions);

        res.json({ message: 'Summary generation queued', lectureId });
    } catch (error) {
        next(error);
    }
});

// T034: POST /api/lectures/:lectureId/quiz/generate
router.post('/:lectureId/quiz/generate', quizLimiter, [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const lectureId = req.params.lectureId;
        const course = await Course.findOne({ 'sections.lectures._id': lectureId });
        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const targetLecture = findLectureInCourse(course, lectureId);
        if (!targetLecture) return res.status(404).json({ error: 'Lecture not found' });

        await ensureTranscription(course, lectureId, targetLecture);

        await Course.findOneAndUpdate(
            { _id: course._id, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.quiz': 'pending' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );
        await quizQueue.add('generate-quiz', { lectureId, courseId: course._id.toString() }, jobOptions);

        res.json({ message: 'Quiz generation queued', lectureId });
    } catch (error) {
        next(error);
    }
});

// User-accessible variant of the admin /internal/.../process endpoint.
// Triggers the full AI pipeline for a single lecture. Rate-limited to prevent
// abuse. Used by the autoStart flow in QuizTab/NotesTab when a lecture has
// never been processed.
router.post('/:lectureId/process', quizLimiter, [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const lectureId = req.params.lectureId;
        const course = await Course.findOne({ 'sections.lectures._id': lectureId });
        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const targetLecture = findLectureInCourse(course, lectureId);
        if (!targetLecture) return res.status(404).json({ error: 'Lecture not found' });

        // Only reset if NOT already complete or in progress
        const t = targetLecture.aiStatus?.transcription;
        if (t === 'complete' || t === 'in_progress') {
            return res.json({ message: 'Pipeline already in progress or complete', skipped: true });
        }

        await Course.findOneAndUpdate(
            { _id: course._id, 'sections.lectures._id': lectureId },
            { $set: {
                'sections.$[].lectures.$[lec].aiStatus.transcription': 'pending',
                'sections.$[].lectures.$[lec].aiStatus.errorReason': null,
            } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        await transcriptionQueue.add('transcribe', {
            courseId: course._id.toString(),
            lectureId,
            youtubeId: targetLecture.youtubeId,
            durationSecs: targetLecture.duration,
        }, jobOptions);

        res.json({ message: 'Pipeline queued', lectureId });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
