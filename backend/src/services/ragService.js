const aiProvider = require('./ai-provider');
const { Pinecone } = require('@pinecone-database/pinecone');
const { validate, SchemaValidationError } = require('../schemas/ragAnswerSchema');

// Lazy-initialize so env vars are loaded before use
let _pc;
const getPinecone = () => _pc || (_pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY }));

// T015 & T020 Grounding System Prompt
// T015 & T020 Grounding System Prompt - UPDATED: Hybrid knowledge approach
const GROUNDING_SYSTEM_PROMPT = `You are an expert teaching assistant and mentor. Your goal is to provide comprehensive, accurate, and insightful answers to student questions.
1. KNOWLEDGE INTEGRATION: You have two sources of information:
   - LECTURE CONTEXT: Specific details from the video transcript (provided in the prompt).
   - GENERAL KNOWLEDGE: Your vast internal training data on the subject matter.
2. HYBRID RESPONSE: Always prioritize factual accuracy and clarity. If the lecture context provides part of the answer, use it. If the question goes beyond the lecture or requires broader explanation/real-world examples, use your general knowledge freely.
3. BE OPEN & HELPFUL: Do not restrict yourself to ONLY what was said in the video. If a student asks a "tweaky" or "out of the lecture" question, answer it thoroughly using your full expertise.
4. CITATIONS: If you use information from the LECTURE CONTEXT, cite the [timestamp_seconds] where possible.
5. FORMAT: Return a JSON object:
   - "answerText": Your detailed, multi-paragraph, and well-formatted markdown answer.
   - "citations": Array of { timestamp, label, chunkIndex } for lecture matches.
   - "usedGeneralKnowledge": boolean.
   - "notFound": false (You should almost always be able to provide a helpful answer).
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

    // 3. Assemble Context (Prioritize lecture if score is good enough)
    const contextString = topScore >= minScore 
        ? matches.map(match => `[${match.metadata.startTimestamp}] ${match.metadata.text}`).join('\n\n')
        : "NO RELEVANT LECTURE CONTEXT FOUND. Answer based on your general knowledge.";

    const userMessage = `CONTEXT (FROM LECTURE):\n${contextString}\n\nQUESTION: ${questionText}`;

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
