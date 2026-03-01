const mongoose = require('mongoose');
const { Schema } = mongoose;

const doubtQuerySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lectureId: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    questionText: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

doubtQuerySchema.index({ userId: 1, lectureId: 1, createdAt: 1 });
doubtQuerySchema.index({ lectureId: 1 });

module.exports = mongoose.model('DoubtQuery', doubtQuerySchema);
