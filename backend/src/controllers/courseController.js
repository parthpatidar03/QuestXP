const { validationResult } = require('express-validator');
const axios = require('axios');

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
            .select('title status totalLectures createdAt sections.title sections._id sections.lectures.thumbnailUrl')
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
            // Hoist the first lecture thumbnail to the top level for easy access
            thumbnailUrl: c.sections?.[0]?.lectures?.[0]?.thumbnailUrl || null,
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
        
        // Trigger background processing for the new section
        await courseService.addSection(course._id, { title, playlistUrl });

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
            message: 'Playlist added and processing started',
            newEndDateMessage
        });
    } catch (error) {
        next(error);
    }
};

const deleteCourse = async (req, res, next) => {
    try {
        const success = await courseService.deleteCourse(req.params.courseId, req.user._id);
        if (!success) return res.status(404).json({ error: 'Course not found' });

        res.json({ message: 'Course deleted permanently' });
    } catch (error) {
        next(error);
    }
};

const updateCourse = async (req, res, next) => {
    try {
        const { title } = req.body;
        const course = await Course.findOneAndUpdate(
            { _id: req.params.courseId, owner: req.user._id },
            { $set: { title } },
            { new: true }
        );
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json({ course });
    } catch (error) {
        next(error);
    }
};

const updateSection = async (req, res, next) => {
    try {
        const { title } = req.body;
        const course = await Course.findOne({ _id: req.params.courseId, owner: req.user._id });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const section = course.sections.id(req.params.sectionId);
        if (!section) return res.status(404).json({ error: 'Section not found' });

        section.title = title;
        await course.save();
        res.json({ course });
    } catch (error) {
        next(error);
    }
};

const getPlaylistInfo = async (req, res, next) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const playlistId = url.includes('list=') 
            ? url.split('list=')[1].split('&')[0]
            : url;

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'YouTube API key missing' });

        const response = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
            params: {
                part: 'snippet',
                id: playlistId,
                key: apiKey
            }
        });

        if (!response.data.items || response.data.items.length === 0) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const title = response.data.items[0].snippet.title;
        res.json({ title });
    } catch (error) {
        console.error('[PlaylistInfo] Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch playlist info' });
    }
};

const getSharedCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.courseId)
            .select('title totalLectures totalDuration sections.title sections.lectures.title sections.lectures.duration sections.lectures.thumbnailUrl')
            .lean();
        
        if (!course) return res.status(404).json({ error: 'Course not found' });
        
        res.json({ course });
    } catch (error) {
        next(error);
    }
};

const cloneCourse = async (req, res, next) => {
    try {
        const originalCourse = await Course.findById(req.params.courseId).lean();
        if (!originalCourse) return res.status(404).json({ error: 'Course not found' });

        // Create new course object
        const newCourse = new Course({
            owner: req.user._id,
            title: `${originalCourse.title} (Shared)`,
            status: originalCourse.status,
            totalLectures: originalCourse.totalLectures,
            totalDuration: originalCourse.totalDuration,
            sections: originalCourse.sections.map(section => ({
                title: section.title,
                playlistUrl: section.playlistUrl,
                order: section.order,
                lectures: section.lectures.map(lecture => ({
                    youtubeId: lecture.youtubeId,
                    title: lecture.title,
                    duration: lecture.duration,
                    order: lecture.order,
                    thumbnailUrl: lecture.thumbnailUrl,
                    aiStatus: { ...lecture.aiStatus },
                    topics: [...(lecture.topics || [])]
                }))
            }))
        });

        await newCourse.save();

        // Map old lecture IDs to new ones for cloning associated data
        const oldToNewLectureIds = {};
        originalCourse.sections.forEach((oldSection, sIdx) => {
            oldSection.lectures.forEach((oldLecture, lIdx) => {
                const newLecture = newCourse.sections[sIdx].lectures[lIdx];
                oldToNewLectureIds[oldLecture._id.toString()] = newLecture._id;
            });
        });

        // Clone associated data: Transcripts, Notes, Quizzes
        const oldLectureIds = Object.keys(oldToNewLectureIds);
        
        // 1. Transcripts
        const transcripts = await Transcript.find({ lecture: { $in: oldLectureIds } }).lean();
        if (transcripts.length > 0) {
            const newTranscripts = transcripts.map(t => ({
                ...t,
                _id: undefined,
                lecture: oldToNewLectureIds[t.lecture.toString()],
                course: newCourse._id,
                createdAt: new Date()
            }));
            await Transcript.insertMany(newTranscripts);
        }

        // 2. Notes
        const notes = await Notes.find({ lecture: { $in: oldLectureIds } }).lean();
        if (notes.length > 0) {
            const newNotes = notes.map(n => ({
                ...n,
                _id: undefined,
                lecture: oldToNewLectureIds[n.lecture.toString()],
                userEdits: [],
                generatedAt: new Date()
            }));
            await Notes.insertMany(newNotes);
        }

        // 3. Quizzes
        const quizzes = await Quiz.find({ lecture: { $in: oldLectureIds } }).lean();
        if (quizzes.length > 0) {
            const newQuizzes = quizzes.map(q => ({
                ...q,
                _id: undefined,
                lecture: oldToNewLectureIds[q.lecture.toString()],
                course: newCourse._id,
                generatedAt: new Date()
            }));
            await Quiz.insertMany(newQuizzes);
        }

        res.status(201).json({ 
            message: 'Course cloned successfully', 
            courseId: newCourse._id 
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
    getSharedCourse,
    cloneCourse,
    addCourseSection,
    deleteCourse,
    updateCourse,
    updateSection,
    getPlaylistInfo
};

