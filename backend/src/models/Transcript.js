const mongoose = require('mongoose');
const { Schema } = mongoose;

const transcriptSchema = new Schema({
    lecture: { type: Schema.Types.ObjectId, ref: 'Course.sections.lectures', required: true, unique: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    source: { type: String, enum: ['platform_captions', 'local_stt'], required: true },
    language: { type: String, default: 'en' },
    fullText: { type: String, required: true },
    segments: [{
        text: { type: String, required: true },
        start: { type: Number, required: true },
        end: { type: Number, required: true },
    }],
    durationSecs: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

transcriptSchema.index({ lecture: 1 }, { unique: true });
transcriptSchema.index({ course: 1 });

module.exports = mongoose.model('Transcript', transcriptSchema);
