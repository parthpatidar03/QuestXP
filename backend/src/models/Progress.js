const mongoose = require('mongoose');
const { Schema } = mongoose;

const progressSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },

    lectureProgress: [{
        lecture: { type: Schema.Types.ObjectId, required: true },
        watchedSeconds: { type: Number, default: 0 },
        lastPosition: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        watchCount: { type: Number, default: 0 },
    }],

    completedCount: { type: Number, default: 0 },
    completionPct: { type: Number, default: 0 },
    lastLectureId: { type: Schema.Types.ObjectId, default: null },
    totalMinutes: { type: Number, default: 0 },

    studySessions: [{
        date: { type: Date, required: true },
        minutesStudied: { type: Number, default: 0 },
        lecturesCompleted: [{ type: Schema.Types.ObjectId }],
        goalMet: { type: Boolean, default: false },
    }],

    studyPlan: { type: Object, default: null },

    deadline: { type: Date, default: null },
    weekdayCapacityMins: { type: Number, default: 0 },
    weekendCapacityMins: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
});

progressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
