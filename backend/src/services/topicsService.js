const OpenAI = require('openai');
const Transcript = require('../models/Transcript');
const Course = require('../models/Course');
const { validateTopics } = require('../schemas/topicsSchema');
const { 
    MIN_DURATION_FOR_TOPICS,
    ERROR_GPT_SCHEMA_INVALID 
} = require('../constants/aiPipeline');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const TOPICS_SYSTEM_PROMPT = `
You are an expert AI creating chronological topic chapters for a video.
Analyze the provided transcript and segment it into logical topics.
Respond strictly in JSON matching this schema:
{
  "topics": [
    { "title": "Introduction to React", "startTime": 0 },
    { "title": "Understanding Hooks", "startTime": 125 }
  ]
}
Rules:
- Give meaningful titles (min 3 characters).
- StartTime must be in seconds (integer).
- The first topic should generally start at 0.
- Ensure timestamps are strictly chronological.
- Provide at least 2 topics.
Use the response_format: { type: "json_object" } feature.
`;

class TopicsService {
    async generate(lectureId) {
        // Load transcript
        const transcript = await Transcript.findOne({ lecture: lectureId });
        if (!transcript) throw new Error('Transcript not found for this lecture');

        // Check duration threshold
        if (transcript.durationSecs < MIN_DURATION_FOR_TOPICS) {
            // Throw a specific error that the worker will catch and log as "skipped"
            const error = new Error('Lecture too short for topic segmentation');
            error.code = 'LECTURE_TOO_SHORT';
            throw error;
        }

        // Construct payload
        const messages = [
            { role: 'system', content: TOPICS_SYSTEM_PROMPT },
            { role: 'user', content: transcript.fullText }
        ];

        // Call GPT API
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            response_format: { type: 'json_object' },
            messages,
        });

        // Parse and validate
        const content = response.choices[0].message.content;
        let raw;
        try {
            raw = JSON.parse(content);
        } catch (error) {
            console.error('[TopicsService] Failed to parse GPT JSON:', content);
            throw new Error(ERROR_GPT_SCHEMA_INVALID);
        }

        const isValid = validateTopics(raw);
        if (!isValid) {
            console.error('[TopicsService] Ajv validation failed:', validateTopics.errors);
            throw new Error(ERROR_GPT_SCHEMA_INVALID);
        }

        // Update the Course document recursively with generated topics
        await Course.findOneAndUpdate(
            { 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].topics': raw.topics } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        return raw.topics;
    }
}

module.exports = new TopicsService();
