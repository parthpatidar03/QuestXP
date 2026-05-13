const Progress = require('../models/Progress');
const Course = require('../models/Course');
const xpService = require('./xpService');
const streakService = require('./streakService');
const Roadmap = require('../models/Roadmap');

const getOrCreateProgress = async (userId, courseId) => {
    try {
        const progress = await Progress.findOneAndUpdate(
            { user: userId, course: courseId },
            {
                $setOnInsert: {
                    user: userId,
                    course: courseId,
                    lectureProgress: [],
                    studySessions: []
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (!progress) throw new Error('Progress not found after upsert');
        return progress;
    } catch (error) {
        if (error.code === 11000) {
            const progress = await Progress.findOne({ user: userId, course: courseId });
            if (progress) return progress;
        }
        throw error;
    }
};

const savePosition = async (userId, courseId, lectureId, { position, watchedSeconds }) => {
    const course = await Course.findById(courseId);

    if (!course) throw new Error('Course not found');

    const progress = await getOrCreateProgress(userId, courseId);

    // Find the lecture in the course to get its total duration
    let lectureDuration = 0;
    for (const section of course.sections) {
        const lecture = section.lectures.find(l => l._id.toString() === lectureId.toString());
        if (lecture) {
            lectureDuration = lecture.duration;
            break;
        }
    }

    let lectureProg = progress.lectureProgress.find(lp => lp.lecture.toString() === lectureId.toString());

    if (!lectureProg) {
        lectureProg = {
            lecture: lectureId,
            lastPosition: position,
            watchedSeconds: 0,
            completed: false
        };
        progress.lectureProgress.push(lectureProg);
    }

    // Debounce/avoid spam (e.g. only update if watchedSeconds > 0)
    if (watchedSeconds > 0) {
        lectureProg.watchedSeconds += watchedSeconds;
    }
    lectureProg.lastPosition = position;
    lectureProg.lastAccessedAt = new Date();
    progress.lastLectureId = lectureId;

    let newlyCompleted = false;

    // Append study session for today
    const todayStr = streakService.getISTDateString();
    let session = progress.studySessions.find(s => streakService.getISTDateString(s.date) === todayStr);

    if (!session) {
        session = { date: new Date(), minutesStudied: 0 };
        progress.studySessions.push(session);
    }

    if (watchedSeconds > 0) {
        session.minutesStudied = (session.minutesStudied || 0) + (watchedSeconds / 60);
    }

    // Save changes to progress before doing side-effects
    await progress.save();

    // Side-effects
    let xpAwarded = 0;
    let awardResult = null;
    
    if (newlyCompleted) {
        awardResult = await xpService.award(userId, 'LECTURE_COMPLETED');
        if (awardResult && awardResult.xpEarned) {
            xpAwarded += awardResult.xpEarned;
        }
        await streakService.recordActivity(userId);

        // Recalculate course completion %
        const completedCount = progress.lectureProgress.filter(lp => lp.completed).length;
        progress.completionPct = course.totalLectures > 0 ? Math.round((completedCount / course.totalLectures) * 100) : 0;
        progress.lastAccessedAt = new Date();
        await progress.save();
    } else if (watchedSeconds > 0) {
        await streakService.recordActivity(userId); // Any watch time counts for streak
    }

    if (progress.studyPlan?.dailyGoalMins && session.minutesStudied >= progress.studyPlan.dailyGoalMins) {
        // Assuming xpService handles dedup logic per day per user based on resourceId/date
        const streakResult = await xpService.award(userId, 'GOAL_MET', todayStr);
        if (streakResult && streakResult.xpEarned && !awardResult) {
            // Only purely add if we returned numeric xpEarned above too, or maybe just ignore returning this back to Player directly since Player only cares about lecture xp
        }
    }

    return {
        completed: newlyCompleted,
        xpAwarded,
        completionPct: progress.completionPct,
        lectureProgress: lectureProg
    };
};

const toggleLecture = async (userId, courseId, lectureId, isCompleted) => {
    const course = await Course.findById(courseId);
    const nextCompleted = Boolean(isCompleted);

    if (!course) throw new Error('Course not found');

    const progress = await getOrCreateProgress(userId, courseId);

    let lectureProg = progress.lectureProgress.find(lp => lp.lecture.toString() === lectureId.toString());

    if (!lectureProg) {
        lectureProg = {
            lecture: lectureId,
            lastPosition: 0,
            watchedSeconds: 0,
            completed: false
        };
        progress.lectureProgress.push(lectureProg);
    }

    const wasCompleted = lectureProg.completed;
    
    // Set status
    lectureProg.completed = nextCompleted;
    if (nextCompleted) {
        lectureProg.completedAt = new Date();
    } else {
        lectureProg.completedAt = undefined;
    }

    let xpAwarded = 0;
    // Award XP ONLY if it was not completed before and now it is
    if (nextCompleted && !wasCompleted) {
        const awardResult = await xpService.award(userId, 'LECTURE_COMPLETED');
        xpAwarded = awardResult?.xpEarned || 50;
        await streakService.recordActivity(userId);
    }

    // Recalculate Course Completion
    const completedCount = progress.lectureProgress.filter(lp => lp.completed).length;
    progress.completedCount = completedCount;
    progress.completionPct = course.totalLectures > 0 ? Math.round((completedCount / course.totalLectures) * 100) : 0;
    progress.lastAccessedAt = new Date();
    progress.lastLectureId = lectureId;

    await progress.save();

    // BI-DIRECTIONAL SYNC: Update Roadmap if it exists
    try {
        const roadmaps = await Roadmap.find({ 
            userId, 
            $or: [
                { courseId },
                { "days.plannedVideos.videoId": lectureId }
            ]
        });

        for (const roadmap of roadmaps) {
            let changed = false;
            for (const day of roadmap.days) {
                for (const vid of day.plannedVideos) {
                    if (vid.videoId.toString() === lectureId.toString()) {
                        if (vid.completed !== nextCompleted) {
                            vid.completed = nextCompleted;
                            changed = true;
                        }
                    }
                }
            }
            if (changed) {
                await roadmap.save();
            }
        }
    } catch (syncError) {
        console.error("[Sync] Failed to sync roadmap progress:", syncError);
        // Don't fail the main request if roadmap sync fails
    }

    return {
        success: true,
        xpAwarded,
        completionPct: progress.completionPct,
        lectureProgress: lectureProg,
        isCompleted: nextCompleted
    };
};

module.exports = {
    savePosition,
    toggleLecture
};
