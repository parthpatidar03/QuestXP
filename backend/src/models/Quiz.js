const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizSchema = new Schema({
    lecture: { type: Schema.Types.ObjectId, ref: 'Course.sections.lectures', required: true, unique: true },
    questions: [{
        question: { type: String, required: true },
        options: {
            type: [String],
            validate: [val => val.length >= 2 && val.length <= 5, '{PATH} must have between 2 and 5 options']
        },
        correctIndices: { 
            type: [Number], 
            required: true,
            validate: [val => val.length >= 1, 'At least one correct index is required']
        },
        isMultipleChoice: { type: Boolean, default: false },
        explanation: { type: String, required: true }
    }],
    questionCount: { type: Number, required: true },
    generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
