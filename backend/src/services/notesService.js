const aiProvider = require('./ai-provider');
const Transcript = require('../models/Transcript');
const Notes = require('../models/Notes');
const { validateNotes } = require('../schemas/notesSchema');
const { ERROR_GPT_SCHEMA_INVALID } = require('../constants/aiPipeline');

const NOTES_SYSTEM_PROMPT = `
You are an expert AI tutor creating high-quality, structured study notes.
Extract and summarize the provided video transcript into the following structure:
- "summary": A brief, engaging overview (2-3 sentences). This field is MANDATORY.
- "keyPoints": Array of strings covering the main takeaways.
- "definitions": Array of { term, definition, timestamp (in seconds) } objects. Use precise timestamps.
- "formulas": (Optional) Array of { label, content, timestamp } objects. Provide if math/logic equations are present.
- "codeSnippets": (Optional) Array of { language, code, timestamp }. Provide if coding examples are given.
- "commonMistakes": (Optional) Array of strings highlighting common pitfalls mentioned.
- "highPriority": Important topics or exam-focused highlights.

You MUST respond strictly in valid JSON matching this schema precisely. No trailing commas. No markdown wrappers. Use the response_format: { type: "json_object" } feature.
The "summary" field is required for validation.
`;

class NotesService {
    async generate(lectureId) {
        // Load transcript
        const transcript = await Transcript.findOne({ lecture: lectureId });
        if (!transcript) throw new Error('Transcript not found for this lecture');

        let raw;
        try {
            const prompt = `
            TRANSCRIPT:
            ${transcript.fullText}

            TASK:
            ${NOTES_SYSTEM_PROMPT}
            `;

            raw = await aiProvider.generateJSON(prompt, NOTES_SYSTEM_PROMPT);
        } catch (error) {
            console.error('[NotesService] AI Generation failed:', error);
            throw new Error(ERROR_GPT_SCHEMA_INVALID);
        }

        // Fallback for summary if missing
        if (!raw.summary && raw.keyPoints && raw.keyPoints.length > 0) {
            raw.summary = raw.keyPoints[0];
        } else if (!raw.summary) {
            raw.summary = "Study notes for this lecture.";
        }

        // Fallback for other required fields
        if (!raw.keyPoints) raw.keyPoints = [];
        if (!raw.definitions) raw.definitions = [];
        if (!raw.highPriority) raw.highPriority = [];

        const isValid = validateNotes(raw);
        if (!isValid) {
            console.error('[NotesService] Ajv validation failed:', validateNotes.errors);
            throw new Error(ERROR_GPT_SCHEMA_INVALID);
        }

        // Save Notes Model
        const newNotes = await Notes.findOneAndUpdate(
            { lecture: lectureId },
            {
                lecture: lectureId,
                summary: raw.summary,
                keyPoints: raw.keyPoints || [],
                definitions: raw.definitions || [],
                formulas: raw.formulas || [],
                codeSnippets: raw.codeSnippets || [],
                commonMistakes: raw.commonMistakes || [],
                highPriority: raw.highPriority || []
            },
            { upsert: true, new: true }
        );

        return newNotes;
    }
}

module.exports = new NotesService();
