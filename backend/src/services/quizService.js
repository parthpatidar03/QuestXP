const OpenAI = require('openai');
const Transcript = require('../models/Transcript');
const Quiz = require('../models/Quiz');
const { validateQuiz } = require('../schemas/quizSchema');
const { 
    MIN_DURATION_FOR_QUIZ_SHORT,
    MIN_DURATION_FOR_QUIZ_FULL,
    ERROR_GPT_SCHEMA_INVALID 
} = require('../constants/aiPipeline');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

class QuizService {
    async generate(lectureId) {
        // Load transcript
        const transcript = await Transcript.findOne({ lecture: lectureId });
        if (!transcript) throw new Error('Transcript not found for this lecture');

        // Check duration thresholds
        if (transcript.durationSecs < MIN_DURATION_FOR_QUIZ_SHORT) {
            const error = new Error('Lecture too short for quiz');
            error.code = 'LECTURE_TOO_SHORT';
            throw error;
        }

        const requiredQuestions = 5;

        const QUIZ_SYSTEM_PROMPT = `
You are an expert educator producing high-stakes, analytical multiple choice quizzes.
Your goal: Ensure users cannot pass with a perfect score without carefully watching the lecture.

Difficulty Distribution:
- 1 EASY: Recall of a core fact or definition.
- 2 MEDIUM: Conceptual logic and reasoning.
- 2 HARD: Deep application or recall of specific nuances. 

Anti-Guessing & Hardening:
- HARD questions MUST focus on unique details: specific examples, names of tools/people, or "edge cases" from the speaker.
- Options for HARD questions should be closely similar (plausible distractors). Avoid "obviously wrong" answers. For theoretical questions, make the options differ only by subtle nuances to prevent easy elimination.
- Keep the EASY question straightforward to avoid overwhelming the user.
- Use phrasing like "According to the speaker, why did X happen?" or "The instructor used the example of Y to demonstrate what?"
- Questions should be detailed and testing for actual comprehension.

Format Rules:
- "correctIndices": An array of 0-based integers. Multiple options can be correct.
- "isMultipleChoice": Boolean. True if there is more than one correct answer in "correctIndices".
- "explanation": CRITICAL. Provide a 2-3 sentence explanation of why the answer(s) are correct based on the video content.
- Output MUST be valid JSON matching the schema.

JSON Structure:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "...", "..."],
      "correctIndices": [0, 2],
      "isMultipleChoice": true,
      "explanation": "..."
    }
  ]
}
`;

        // Construct payload
        const messages = [
            { role: 'system', content: QUIZ_SYSTEM_PROMPT },
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
            console.error('[QuizService] Failed to parse GPT JSON:', content);
            throw new Error(ERROR_GPT_SCHEMA_INVALID);
        }

        const isValid = validateQuiz(raw);
        if (!isValid) {
            console.error('[QuizService] Ajv validation failed:', validateQuiz.errors);
            throw new Error(ERROR_GPT_SCHEMA_INVALID);
        }

        // Save Quiz Model
        const newQuiz = await Quiz.findOneAndUpdate(
            { lecture: lectureId },
            {
                lecture: lectureId,
                questions: raw.questions,
                questionCount: raw.questions.length
            },
            { upsert: true, new: true }
        );

        return newQuiz;
    }
}

module.exports = new QuizService();
