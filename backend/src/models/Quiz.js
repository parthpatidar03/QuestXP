const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizSchema = new Schema({
    lecture: { type: Schema.Types.ObjectId, ref: 'Course.sections.lectures', required: true, unique: true },
    questions: [{
        question: { type: String, required: true },
        options: {
            type: [String],
            validate: [val => val.length >= 2 && val.length <= 4, '{PATH} must have between 2 and 4 options']
        },
        correctIndex: { type: Number, required: true, min: 0, max: 3 },
        explanation: { type: String, required: true }
    }],
    questionCount: { type: Number, required: true },
    generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
