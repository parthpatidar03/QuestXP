const mongoose = require('mongoose');
const { Schema } = mongoose;

const feedbackSchema = new Schema({
    userName: { type: String, trim: true },
    userEmail: { type: String, trim: true, lowercase: true },
    message: { type: String, required: true },
    contextPage: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', feedbackSchema);
