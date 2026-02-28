const { recalculate } = require('../services/studyPlanService');

const getTodayPlan = async (req, res, next) => {
    try {
        const plan = await recalculate(req.user._id);
        res.json({ plan });
    } catch (error) {
        next(error);
    }
};

module.exports = { getTodayPlan };
