const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizAttemptSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Course.sections.lectures', required: true },
    answers: [{ type: Number }],
    score: { type: Number, required: true, min: 0, max: 100 },
    timeTakenSecs: { type: Number, required: true, min: 0 },
    attemptNumber: { type: Number, required: true, min: 1 },
    attemptedAt: { type: Date, default: Date.now }
});

quizAttemptSchema.index({ user: 1, lecture: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
