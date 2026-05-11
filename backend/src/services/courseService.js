const Course = require('../models/Course');
const courseQueue = require('../queues/courseQueue');

const createCourse = async (ownerId, data) => {
    const course = new Course({
        owner: ownerId,
        title: data.title,
        sections: data.sections.map(s => ({
            title: s.title,
            playlistUrl: s.playlistUrl,
            order: s.order,
            lectures: []
        })),
        status: 'processing'
    });

    await course.save();

    await courseQueue.add('process-course', {
        courseId: course._id,
        sections: data.sections
    });

    return course;
};

const addSection = async (courseId, sectionData) => {
    // sectionData: { title, playlistUrl }
    await courseQueue.add('process-course', {
        courseId,
        sections: [sectionData],
        isAppend: true
    });
};

const Progress = require('../models/Progress');
const Transcript = require('../models/Transcript');
const Notes = require('../models/Notes');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const EmbeddingStatus = require('../models/EmbeddingStatus');
const DoubtQuery = require('../models/DoubtQuery');
const DoubtAnswer = require('../models/DoubtAnswer');

/**
 * Permanently deletes a course and all associated data (progress, transcripts, notes, quizzes, etc.)
 */
const deleteCourse = async (courseId, ownerId) => {
    const course = await Course.findOne({ _id: courseId, owner: ownerId }).select('_id sections');
    if (!course) return false;

    const lectureIds = course.sections.flatMap(section =>
        (section.lectures || []).map(lecture => lecture._id)
    );

    const doubtQueries = await DoubtQuery.find({ courseId: course._id }).select('_id').lean();
    const doubtQueryIds = doubtQueries.map(query => query._id);

    const cleanupOps = [
        Progress.deleteMany({ course: course._id }),
        Transcript.deleteMany({ course: course._id }),
        EmbeddingStatus.deleteMany({ courseId: course._id }),
        DoubtQuery.deleteMany({ courseId: course._id }),
        Course.deleteOne({ _id: course._id, owner: ownerId })
    ];

    if (lectureIds.length > 0) {
        cleanupOps.push(
            Notes.deleteMany({ lecture: { $in: lectureIds } }),
            Quiz.deleteMany({ lecture: { $in: lectureIds } }),
            QuizAttempt.deleteMany({ lecture: { $in: lectureIds } })
        );
    }

    if (doubtQueryIds.length > 0) {
        cleanupOps.push(DoubtAnswer.deleteMany({ queryId: { $in: doubtQueryIds } }));
    }

    await Promise.all(cleanupOps);
    return true;
};

module.exports = { createCourse, addSection, deleteCourse };
