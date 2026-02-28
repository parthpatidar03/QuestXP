const Progress = require('../models/Progress');
const Course = require('../models/Course');

const generatePlan = async (userId) => {
    // MVP Algorithm: Fetch all in-progress courses
    const progresses = await Progress.find({ user: userId }).populate('course');
    const todayPlan = {
        date: new Date(),
        courses: []
    };

    let totalMins = 0;

    for (const prog of progresses) {
        if (!prog.course || prog.course.status !== 'ready' || prog.completionPct >= 100) continue;

        // Find next incomplete lecture to schedule
        let nextLecture = null;
        for (const section of prog.course.sections) {
            for (const lec of section.lectures) {
                const lp = prog.lectureProgress.find(p => p.lecture.toString() === lec._id.toString());
                if (!lp || !lp.completed) {
                    nextLecture = lec;
                    break;
                }
            }
            if (nextLecture) break;
        }

        if (nextLecture) {
            const plannedMins = Math.ceil(nextLecture.duration / 60);
            todayPlan.courses.push({
                courseId: prog.course._id,
                courseTitle: prog.course.title,
                lectureId: nextLecture._id,
                lectureTitle: nextLecture.title,
                plannedMinutes: plannedMins
            });
            totalMins += plannedMins;
        }
    }

    return { ...todayPlan, totalPlannedMinutes: totalMins };
};

const recalculate = async (userId) => {
    // In advanced versions, this could diff the plan vs reality.
    // For now, dynamic recalculation just reconfigures the daily plan.
    return await generatePlan(userId);
};

module.exports = { generatePlan, recalculate };
