const mongoose = require('mongoose');
const { Schema } = mongoose;

const notesSchema = new Schema({
    lecture: { type: Schema.Types.ObjectId, ref: 'Course.sections.lectures', required: true, unique: true },
    summary: { type: String, required: true },
    keyPoints: [{ type: String }],
    definitions: [{
        term: { type: String, required: true },
        definition: { type: String, required: true },
        timestamp: { type: Number, required: true }
    }],
    formulas: [{
        label: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Number, required: true }
    }],
    codeSnippets: [{
        language: { type: String, required: true },
        code: { type: String, required: true },
        timestamp: { type: Number, required: true }
    }],
    commonMistakes: [{ type: String }],
    highPriority: [{ type: String }],
    userEdits: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        editedAt: { type: Date, default: Date.now }
    }],
    generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notes', notesSchema);
