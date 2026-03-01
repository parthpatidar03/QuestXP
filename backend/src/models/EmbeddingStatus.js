const mongoose = require('mongoose');
const { Schema } = mongoose;

const embeddingStatusSchema = new Schema({
    lectureId: { type: String, required: true, unique: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'complete', 'failed'],
        default: 'pending'
    },
    totalChunks: { type: Number, default: 0 },
    errorReason: { type: String, default: null },
    startedAt: { type: Date },
    completedAt: { type: Date },
}, { timestamps: true });

embeddingStatusSchema.index({ courseId: 1, status: 1 });

module.exports = mongoose.model('EmbeddingStatus', embeddingStatusSchema);
