const Progress = require('../models/Progress');
const Course = require('../models/Course');
const xpService = require('./xpService');
const streakService = require('./streakService');

const savePosition = async (userId, courseId, lectureId, { position, watchedSeconds }) => {
    let progress = await Progress.findOne({ user: userId, course: courseId });
    const course = await Course.findById(courseId);

    if (!course) throw new Error('Course not found');

    if (!progress) {
        progress = new Progress({
            user: userId,
            course: courseId,
            lectureProgress: [],
            studySessions: [],
            studyPlan: {
                dailyGoalMins: 45 // default
            }
        });
    }

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

    // Auto-completion based on watch time removed per US-RESTRUCTURE
    // Completion now requires a Quiz submission.
    let newlyCompleted = false;

    // Append study session for today
    const todayStr = streakService.getISTDateString();
    let session = progress.studySessions.find(s => streakService.getISTDateString(s.date) === todayStr);

    if (!session) {
        session = { date: new Date(), minutes: 0 };
        progress.studySessions.push(session);
    }

    if (watchedSeconds > 0) {
        // For simplicity, add to minutes (fractional)
        session.minutes += (watchedSeconds / 60);
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

    if (session.minutes >= progress.studyPlan.dailyGoalMins) {
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

const completeLecture = async (userId, courseId, lectureId) => {
    let progress = await Progress.findOne({ user: userId, course: courseId });
    const course = await Course.findById(courseId);

    if (!course) throw new Error('Course not found');
    if (!progress) {
        progress = new Progress({
            user: userId,
            course: courseId,
            lectureProgress: [],
            studySessions: [],
            studyPlan: { dailyGoalMins: 45 }
        });
    }

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

    if (lectureProg.completed) {
        return { alreadyCompleted: true, completionPct: progress.completionPct };
    }

    // Mark complete
    lectureProg.completed = true;
    lectureProg.completedAt = new Date();

    // Award XP
    const awardResult = await xpService.award(userId, 'LECTURE_COMPLETED');
    const xpAwarded = awardResult?.xpEarned || 50;

    // Record Streak Activity
    await streakService.recordActivity(userId);

    // Recalculate Course Completion
    const completedCount = progress.lectureProgress.filter(lp => lp.completed).length;
    progress.completionPct = course.totalLectures > 0 ? Math.round((completedCount / course.totalLectures) * 100) : 0;
    progress.lastAccessedAt = new Date();

    await progress.save();

    return {
        success: true,
        xpAwarded,
        completionPct: progress.completionPct,
        lectureProgress: lectureProg
    };
};

module.exports = {
    savePosition,
    completeLecture
};
