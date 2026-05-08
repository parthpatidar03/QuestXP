const { validationResult } = require('express-validator');
const aiProvider = require('../services/ai-provider');

/**
 * POST /api/doubts/:lectureId/simple
 * Simple LLM chatbot — no RAG, no Pinecone.
 * Uses course/lecture title as context in system prompt.
 * Supports multi-turn conversation via history array.
 */
exports.query = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { questionText, courseTitle, lectureTitle, history = [] } = req.body;

        const systemPrompt = `You are an expert AI teaching assistant for the QuestXP learning platform.
The student is currently watching a lecture titled: "${lectureTitle || 'this lecture'}"
This lecture is part of a course called: "${courseTitle || 'this course'}"

Your role:
- Answer questions about the topics covered in this lecture and course
- Help students understand concepts, solve problems, and clarify doubts
- Be encouraging, concise, and use simple examples where helpful
- If a question seems unrelated to the course topic, gently redirect to course content
- Format your response clearly. Use bullet points or numbered lists where helpful.
Keep answers focused and under 200 words unless a detailed explanation is truly needed.`;

        const answer = await aiProvider.generateChat(questionText, systemPrompt, history);

        return res.json({ answer, questionText });

    } catch (error) {
        console.error('[SimpleChatController] Error:', error.message);
        if (error.status === 429) {
            return res.status(429).json({ error: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment.' });
        }
        return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Chatbot temporarily unavailable.' });
    }
};
