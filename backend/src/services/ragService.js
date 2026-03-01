const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');
const { validate, SchemaValidationError } = require('../schemas/ragAnswerSchema');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

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
    const startTime = Date.now();
    const indexName = process.env.PINECONE_INDEX_NAME || 'questxp';
    const index = pc.Index(indexName);

    // 1. Embed Question
    const embedRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: questionText
    });
    const queryEmbedding = embedRes.data[0].embedding;

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

    // 5. GPT-4o Call
    const gptStart = Date.now();
    const chatRes = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: GROUNDING_SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
        ]
    });
    const gptLatency = Date.now() - gptStart;
    console.log(`[RAG] GPT call took ${gptLatency}ms.`);

    const parsedContent = JSON.parse(chatRes.choices[0].message.content);

    // 6. Validate Output
    validate(parsedContent);

    // Attach chunks used for internal tracking
    parsedContent.chunksUsed = matches.map(m => m.metadata.chunkIndex);

    return parsedContent;
};
