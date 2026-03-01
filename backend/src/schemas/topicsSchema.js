const Ajv = require("ajv");
const ajv = new Ajv();

const topicsSchema = {
    type: "object",
    properties: {
        topics: {
            type: "array",
            minItems: 2,
            items: {
                type: "object",
                properties: {
                    title: { type: "string", minLength: 3 },
                    startTime: { type: "number", minimum: 0 }
                },
                required: ["title", "startTime"]
            }
        }
    },
    required: ["topics"],
    additionalProperties: false
};

const validateTopics = ajv.compile(topicsSchema);

module.exports = {
    topicsSchema,
    validateTopics
};
