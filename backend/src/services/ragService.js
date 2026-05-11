const aiProvider = require('./ai-provider');
const { Pinecone } = require('@pinecone-database/pinecone');
const { validate, SchemaValidationError } = require('../schemas/ragAnswerSchema');

// Lazy-initialize so env vars are loaded before use
let _pc;
const getPinecone = () => _pc || (_pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY }));

// T015 & T020 Grounding System Prompt
const GROUNDING_SYSTEM_PROMPT = `You are a helpful teaching assistant answering a student's question based strictly on the provided lecture context.
You MUST only use information present in the CONTEXT block.
If the context does not contain sufficient information to answer the question, set "notFound": true, and set "answerText" to "I couldn't find information about this in the current lecture."
Do NOT use general knowledge, training data, or information not present in the context.

When providing an answer, you must cite the timestamp for the exact section where the information is found.
Context chunks are provided as: [timestamp_seconds] {chunk_text}.
Return your response as a JSON object with "answerText" (the prose answer), "citations" (array of { timestamp, label, chunkIndex }), and "notFound" (boolean).
`;

exports.queryLecture = async (lectureId, questionText) => {
    const pc = getPinecone();
    const startTime = Date.now();
    const indexName = process.env.PINECONE_INDEX_NAME || 'questxp';
    const index = pc.Index(indexName);

    // 1. Embed Question using OpenAI
    let queryEmbedding;
    try {
        queryEmbedding = await aiProvider.generateEmbedding(questionText);
    } catch (embedError) {
        console.error(`[RAG] Embedding failed: ${embedError.message}`);
        throw embedError;
    }

    // 2. Query Pinecone
    const topK = parseInt(process.env.RAG_TOP_K) || 5;
    const minScore = parseFloat(process.env.MIN_RELEVANCE_SCORE) || 0.75;

    const pineconeStart = Date.now();
    const queryRes = await index.namespace(lectureId.toString()).query({
        topK,
        vector: queryEmbedding,
        includeMetadata: true,
        // filter: { lectureId: { $eq: lectureId.toString() } } // redundant if namespace is used, but included per spec
    });
    const pineconeLatency = Date.now() - pineconeStart;

    const matches = queryRes.matches || [];
    const topScore = matches.length > 0 ? matches[0].score : 0;

    // T030 Observability
    console.log(`[RAG] Pinecone search inside namespace ${lectureId} took ${pineconeLatency}ms.`);
    console.log(`[RAG] Threshold check: topScore=${topScore}, required=${minScore}. Passed: ${topScore >= minScore}`);

    // 3. Relevance Gate
    if (topScore < minScore) {
        return { notFound: true, answerText: "I couldn't find information about this in the current lecture." };
    }

    // 4. Assemble Context
    const contextString = matches
        .map(match => `[${match.metadata.startTimestamp}] ${match.metadata.text} (chunkIndex: ${match.metadata.chunkIndex})`)
        .join('\n\n');

    const userMessage = `CONTEXT:\n${contextString}\n\nQUESTION: ${questionText}`;

    // 5. AI Provider Call
    const aiStart = Date.now();
    const parsedContent = await aiProvider.generateJSON(userMessage, GROUNDING_SYSTEM_PROMPT);
    const aiLatency = Date.now() - aiStart;
    console.log(`[RAG] AI call took ${aiLatency}ms.`);

    // 6. Validate Output
    validate(parsedContent);

    // Attach chunks used for internal tracking
    parsedContent.chunksUsed = matches.map(m => m.metadata.chunkIndex);

    return parsedContent;
};
