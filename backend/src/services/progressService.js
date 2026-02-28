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

    let newlyCompleted = false;

    // Check completion criteria: >80% AND >120s (or if lecture is shorter than 120s, just 80%)
    if (!lectureProg.completed) {
        const reqDuration = Math.min(120, lectureDuration * 0.8);
        if (lectureProg.watchedSeconds >= reqDuration || lectureProg.watchedSeconds >= lectureDuration * 0.8) {
            lectureProg.completed = true;
            lectureProg.completedAt = new Date();
            newlyCompleted = true;
        }
    }

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
    if (newlyCompleted) {
        xpAwarded += await xpService.award(userId, 'LECTURE_COMPLETED');
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
        await xpService.award(userId, 'GOAL_MET', todayStr);
    }

    return {
        completed: newlyCompleted,
        xpAwarded,
        completionPct: progress.completionPct,
        lectureProgress: lectureProg
    };
};

module.exports = {
    savePosition
};
