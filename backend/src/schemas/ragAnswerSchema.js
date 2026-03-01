const ragAnswerSchema = {
    type: 'object',
    properties: {
        answerText: { type: 'string', minLength: 1 },
        citations: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    timestamp: { type: 'number', minimum: 0 },
                    label: { type: 'string', maxLength: 100 },
                    chunkIndex: { type: 'number' }
                },
                required: ['timestamp', 'label', 'chunkIndex']
            }
        },
        notFound: { type: 'boolean' }
    },
    required: ['answerText', 'citations', 'notFound']
};

class SchemaValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SchemaValidationError';
    }
}

const validate = (parsed) => {
    if (typeof parsed !== 'object' || parsed === null) {
        throw new SchemaValidationError('Root must be an object');
    }
    if (typeof parsed.answerText !== 'string' || parsed.answerText.length === 0) {
        throw new SchemaValidationError('answerText must be a non-empty string');
    }
    if (typeof parsed.notFound !== 'boolean') {
        throw new SchemaValidationError('notFound must be a boolean');
    }
    if (!Array.isArray(parsed.citations)) {
        throw new SchemaValidationError('citations must be an array');
    }
    for (const citation of parsed.citations) {
        if (typeof citation.timestamp !== 'number' || citation.timestamp < 0) {
            throw new SchemaValidationError('citation timestamp must be a non-negative number');
        }
        if (typeof citation.label !== 'string' || citation.label.length > 100) {
            throw new SchemaValidationError('citation label must be a string up to 100 chars');
        }
    }
    
    // T021 [US3] Extracted constraints
    if (parsed.notFound === false && parsed.citations.length === 0) {
        throw new SchemaValidationError('When notFound is false, citations must have at least 1 item');
    }
    
    if (parsed.notFound === true && parsed.answerText !== "I couldn't find information about this in the current lecture.") {
        throw new SchemaValidationError('When notFound is true, answerText must be the exact not found message');
    }

    return true;
};

module.exports = {
    schema: ragAnswerSchema, // For appending to GPT prompt if needed
    validate,
    SchemaValidationError
};
