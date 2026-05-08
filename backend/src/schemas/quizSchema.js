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
                        maxItems: 5,
                        items: { type: "string" }
                    },
                    correctIndices: { 
                        type: "array",
                        items: { type: "integer" },
                        minItems: 1
                    },
                    isMultipleChoice: { type: "boolean" },
                    explanation: { type: "string" }
                },
                required: ["question", "options", "correctIndices", "isMultipleChoice", "explanation"]
            }
        }
    },
    required: ["questions"],
    additionalProperties: true
};

const validateQuiz = ajv.compile(quizSchema);

module.exports = {
    quizSchema,
    validateQuiz
};
