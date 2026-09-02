const Course = require('../models/Course');
const courseQueue = require('../queues/courseQueue');
const {
    recalcCourseTotals,
    pruneRoadmapVideos,
    countRoadmapVideos,
    renumberSections,
    completionPct,
} = require('./courseCleanup');

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
const Roadmap = require('../models/Roadmap');

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

    // A study plan built on a course that no longer exists is dead weight: it
    // still lists the videos, but every link 404s. Course-specific roadmaps go
    // with the course; shared ones just lose this course's videos.
    await removeCourseFromRoadmaps(course._id, ownerId);

    return true;
};

/**
 * Removes one section (one playlist) from a course, along with everything that
 * was generated for its lectures. Used when a section was added by mistake.
 *
 * Returns { ok: true, course } on success, or { ok: false, reason } where
 * reason is 'course_not_found' | 'section_not_found' | 'last_section'.
 */
const deleteSection = async (courseId, sectionId, ownerId) => {
    const course = await Course.findOne({ _id: courseId, owner: ownerId });
    if (!course) return { ok: false, reason: 'course_not_found' };

    const section = course.sections.id(sectionId);
    if (!section) return { ok: false, reason: 'section_not_found' };

    // A course with no sections has nothing left to study, so removing the only
    // section is really a course delete. Make the caller say so explicitly.
    if (course.sections.length <= 1) return { ok: false, reason: 'last_section' };

    const lectureIds = (section.lectures || []).map(lecture => lecture._id);

    course.sections.pull(section._id);

    // Close the gap in `order` so the remaining sections stay 0..n-1.
    renumberSections(course.sections);
    recalcCourseTotals(course);
    await course.save();

    await Promise.all([
        deleteLectureData(course._id, lectureIds),
        removeLecturesFromRoadmaps(course._id, ownerId, lectureIds),
    ]);

    // Percentages are stored against the course's lecture count, so they have
    // to be rebuilt against the smaller course or they read too low forever.
    await resyncProgress(course._id, course.totalLectures);

    return { ok: true, course };
};

/**
 * Deletes the AI output and watch history tied to a specific set of lectures,
 * leaving the rest of the course untouched.
 */
const deleteLectureData = async (courseId, lectureIds) => {
    if (!lectureIds || lectureIds.length === 0) return;

    // EmbeddingStatus and DoubtQuery store lectureId as a string, not an ObjectId.
    const lectureIdStrings = lectureIds.map(id => id.toString());

    const doubtQueries = await DoubtQuery.find({
        courseId,
        lectureId: { $in: lectureIdStrings },
    }).select('_id').lean();
    const doubtQueryIds = doubtQueries.map(query => query._id);

    const cleanupOps = [
        Transcript.deleteMany({ lecture: { $in: lectureIds } }),
        Notes.deleteMany({ lecture: { $in: lectureIds } }),
        Quiz.deleteMany({ lecture: { $in: lectureIds } }),
        QuizAttempt.deleteMany({ lecture: { $in: lectureIds } }),
        EmbeddingStatus.deleteMany({ courseId, lectureId: { $in: lectureIdStrings } }),
        DoubtQuery.deleteMany({ courseId, lectureId: { $in: lectureIdStrings } }),
        Progress.updateMany(
            { course: courseId },
            { $pull: { lectureProgress: { lecture: { $in: lectureIds } } } }
        ),
    ];

    if (doubtQueryIds.length > 0) {
        cleanupOps.push(DoubtAnswer.deleteMany({ queryId: { $in: doubtQueryIds } }));
    }

    await Promise.all(cleanupOps);
};

/**
 * Rebuilds completedCount/completionPct after lectures were removed, so the
 * progress bars match the course that is actually left.
 */
const resyncProgress = async (courseId, totalLectures) => {
    const progressDocs = await Progress.find({ course: courseId });

    await Promise.all(progressDocs.map(progress => {
        const completedCount = progress.lectureProgress.filter(lp => lp.completed).length;
        progress.completedCount = completedCount;
        progress.completionPct = completionPct(completedCount, totalLectures);
        return progress.save();
    }));
};

/** Drops a deleted course out of every roadmap the owner has. */
const removeCourseFromRoadmaps = async (courseId, ownerId) => {
    // Roadmaps generated for this course alone have nothing left to plan.
    await Roadmap.deleteMany({ userId: ownerId, courseId });

    const shared = await Roadmap.find({
        userId: ownerId,
        'config.playlistIds': courseId,
    });

    await Promise.all(shared.map(roadmap => {
        roadmap.config.playlistIds = roadmap.config.playlistIds
            .filter(id => id.toString() !== courseId.toString());

        pruneRoadmapVideos(roadmap, video =>
            video.playlistId && video.playlistId.toString() === courseId.toString());

        // Nothing left to study means the plan is empty, not just shorter.
        if (countRoadmapVideos(roadmap) === 0) {
            return Roadmap.deleteOne({ _id: roadmap._id });
        }
        return roadmap.save();
    }));
};

/** Drops specific lectures out of every roadmap that scheduled them. */
const removeLecturesFromRoadmaps = async (courseId, ownerId, lectureIds) => {
    if (!lectureIds || lectureIds.length === 0) return;

    const removed = new Set(lectureIds.map(id => id.toString()));

    const roadmaps = await Roadmap.find({
        userId: ownerId,
        $or: [{ courseId }, { 'config.playlistIds': courseId }],
    });

    await Promise.all(roadmaps.map(roadmap => {
        pruneRoadmapVideos(roadmap, video => removed.has(video.videoId?.toString()));

        if (countRoadmapVideos(roadmap) === 0) {
            return Roadmap.deleteOne({ _id: roadmap._id });
        }
        return roadmap.save();
    }));
};

module.exports = { createCourse, addSection, deleteCourse, deleteSection };
