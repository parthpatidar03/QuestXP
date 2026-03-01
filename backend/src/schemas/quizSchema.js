const Ajv = require("ajv");
const ajv = new Ajv();

const quizSchema = {
    type: "object",
    properties: {
        questions: {
            type: "array",
            minItems: 3,
            maxItems: 10,
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    options: {
                        type: "array",
                        minItems: 2,
                        maxItems: 4,
                        items: { type: "string" }
                    },
                    correctIndex: { type: "integer", minimum: 0, maximum: 3 },
                    explanation: { type: "string" }
                },
                required: ["question", "options", "correctIndex", "explanation"]
            }
        }
    },
    required: ["questions"],
    additionalProperties: false
};

const validateQuiz = ajv.compile(quizSchema);

module.exports = {
    quizSchema,
    validateQuiz
};
