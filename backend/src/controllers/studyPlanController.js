const Progress = require('../models/Progress');
const { getTodayAllocation } = require('../services/studyPlanService');

const getTodayPlan = async (req, res, next) => {
    try {
        const progresses = await Progress.find({ user: req.user._id }).populate('course');
        let totalPlannedMinutes = 0;
        const courses = [];

        for (const prog of progresses) {
            if (prog.course && prog.course.status === 'ready' && prog.studyPlan) {
                const allocation = await getTodayAllocation(req.user._id, prog.course._id);
                if (allocation && allocation.lectures && allocation.lectures.length > 0) {
                    allocation.lectures.forEach(lec => {
                        if (!lec.completed) {
                            const plannedMins = Math.ceil(lec.duration / 60);
                            courses.push({
                                courseId: prog.course._id,
                                courseTitle: prog.course.title,
                                lectureId: lec._id,
                                lectureTitle: lec.title,
                                plannedMinutes: plannedMins
                            });
                            totalPlannedMinutes += plannedMins;
                        }
                    });
                }
            }
        }

        res.json({ plan: { date: new Date(), courses, totalPlannedMinutes } });
    } catch (error) {
        next(error);
    }
};

module.exports = { getTodayPlan };
