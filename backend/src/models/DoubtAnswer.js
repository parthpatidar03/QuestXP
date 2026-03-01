const mongoose = require('mongoose');
const { Schema } = mongoose;

const citationSchema = new Schema({
    timestamp: { type: Number, required: true, min: 0 },
    label: { type: String, required: true, maxlength: 100 },
    chunkIndex: { type: Number }
});

const doubtAnswerSchema = new Schema({
    queryId: { type: Schema.Types.ObjectId, ref: 'DoubtQuery', required: true, unique: true },
    lectureId: { type: String, required: true },
    answerText: { type: String, required: true },
    citations: [citationSchema],
    chunksUsed: [{ type: Number }], // array of indices
    notFound: { type: Boolean, default: false },
    generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DoubtAnswer', doubtAnswerSchema);
