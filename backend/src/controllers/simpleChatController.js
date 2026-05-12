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
- Answer questions about the topics covered in this lecture and course.
- You have access to broad internet knowledge. If the student asks a question slightly outside the specific lecture context but related to the general subject or common curiosity, answer it thoroughly while maintaining the context of their current learning path.
- Help students understand concepts, solve problems, and clarify doubts.
- Be encouraging, concise, and use simple examples where helpful.
- If a question is entirely unrelated to anything educational or the course, gently steer them back, but otherwise be as helpful as possible using your full knowledge base.
- Format your response clearly. Use bullet points or numbered lists where helpful.
Keep answers focused and under 200 words unless a detailed explanation is truly needed.`;

        const answer = await aiProvider.generateChat(questionText, systemPrompt, history);

        if (!answer) {
            throw new Error('AI provider returned empty response');
        }

        return res.json({ answer, questionText });

    } catch (error) {
        console.error('[SimpleChatController] Critical Error:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            user: req.user?._id
        });

        // T105 — Handle specific OpenAI error codes
        if (error.code === 'insufficient_quota') {
            return res.status(402).json({ 
                error: 'PAYMENT_REQUIRED', 
                message: 'AI service quota exceeded. Please contact support.' 
            });
        }

        if (error.status === 429) {
            return res.status(429).json({ 
                error: 'RATE_LIMITED', 
                message: 'Too many requests to the AI. Please wait a minute.' 
            });
        }

        return res.status(500).json({ 
            error: 'INTERNAL_ERROR', 
            message: 'Chatbot temporarily unavailable.',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
};
