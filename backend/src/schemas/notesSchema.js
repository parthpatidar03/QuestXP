const Ajv = require("ajv");
const ajv = new Ajv();

const notesSchema = {
    type: "object",
    properties: {
        summary: { type: "string" },
        keyPoints: {
            type: "array",
            items: { type: "string" }
        },
        definitions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    term: { type: "string" },
                    definition: { type: "string" },
                    timestamp: { type: "number" }
                },
                required: ["term", "definition", "timestamp"]
            }
        },
        formulas: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    label: { type: "string" },
                    content: { type: "string" },
                    timestamp: { type: "number" }
                },
                required: ["label", "content", "timestamp"]
            }
        },
        codeSnippets: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    language: { type: "string" },
                    code: { type: "string" },
                    timestamp: { type: "number" }
                },
                required: ["language", "code", "timestamp"]
            }
        },
        commonMistakes: {
            type: "array",
            items: { type: "string" }
        },
        highPriority: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["summary", "keyPoints", "definitions", "highPriority"],
    additionalProperties: false
};

const validateNotes = ajv.compile(notesSchema);

module.exports = {
    notesSchema,
    validateNotes
};
