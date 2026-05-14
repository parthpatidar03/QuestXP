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

    if (watchedSeconds > 0) {
        lectureProg.watchedSeconds += watchedSeconds;
    }
    lectureProg.lastPosition = position;
    lectureProg.lastAccessedAt = new Date();
    progress.lastLectureId = lectureId;

    const todayStr = streakService.getISTDateString();
    let session = progress.studySessions.find(s => streakService.getISTDateString(s.date) === todayStr);

    if (!session) {
        session = { date: new Date(), minutesStudied: 0 };
        progress.studySessions.push(session);
    }

    if (watchedSeconds > 0) {
        session.minutesStudied = (session.minutesStudied || 0) + (watchedSeconds / 60);
    }

    await progress.save();

    // Side-effects
    if (watchedSeconds > 0) {
        await streakService.recordActivity(userId);
    }

    if (progress.studyPlan?.dailyGoalMins && session.minutesStudied >= progress.studyPlan.dailyGoalMins) {
        await xpService.award(userId, 'GOAL_MET', todayStr);
    }

    // Screen Time Bonuses (1hr and 3hrs)
    if (session.minutesStudied >= 60) {
        await xpService.award(userId, 'SCREEN_TIME_1HR', `1hr_${todayStr}`);
    }
    if (session.minutesStudied >= 180) {
        await xpService.award(userId, 'SCREEN_TIME_3HR', `3hr_${todayStr}`);
    }

    return {
        completed: false, // savePosition doesn't complete lectures anymore, toggleLecture does
        xpAwarded: 0,
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
        // Calculate flat index of the lecture
        let lectureIndex = 0;
        let found = false;
        for (const section of course.sections) {
            for (const lecture of section.lectures) {
                if (lecture._id.toString() === lectureId.toString()) {
                    found = true;
                    break;
                }
                lectureIndex++;
            }
            if (found) break;
        }
        
        // Formula: 50 + (index * 10)
        const dynamicXP = 50 + (lectureIndex * 10);
        
        const awardResult = await xpService.award(userId, 'LECTURE_COMPLETED', lectureId, dynamicXP);
        xpAwarded = awardResult?.xpEarned || dynamicXP;
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
