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

        const isShortQuiz = transcript.durationSecs < MIN_DURATION_FOR_QUIZ_FULL;
        const requiredQuestions = isShortQuiz ? 3 : 10;

        const QUIZ_SYSTEM_PROMPT = `
You are an expert educator producing challenging, concept-driven multiple choice quizzes.
Create exactly ${requiredQuestions} multiple-choice questions based on the provided video transcript.
Respond strictly in valid JSON matching this schema:
{
  "questions": [
    {
      "question": "What is the primary benefit of...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2,
      "explanation": "Option C is correct because..."
    }
  ]
}
Rules:
- Provide exactly 4 options per question.
- "correctIndex" must be the 0-based integer index of the correct option (0 to 3).
- Explanations should cover why the right answer is correct and why a tricky distractor is wrong.
- Output MUST be valid JSON (response_format: { type: "json_object" }).
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
