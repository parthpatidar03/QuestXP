const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAI } = require('openai');
// Optional: import mongoose model for Transcript if available, but spec says:
// "fetch Transcript.content by lectureId" -> Assuming Transcript model is in ../models/Transcript
let Transcript;
try {
    Transcript = require('../models/Transcript');
} catch (e) {
    // If not found, we handle it later or ignore depending on setup
}
const EmbeddingStatus = require('../models/EmbeddingStatus');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = process.env.PINECONE_INDEX_NAME || 'questxp';

const embeddingWorker = new Worker('embedding', async job => {
    const { lectureId, courseId } = job.data;

    try {
        // T027 [P] Implement atomic index rebuild - delete namespace before processing
        const index = pc.Index(indexName);
        console.log(`Clearing existing vectors for lecture ${lectureId}`);
        await index.namespace(lectureId.toString()).deleteAll();

        // 1. Set status in progress
        await EmbeddingStatus.findOneAndUpdate(
            { lectureId },
            { status: 'in_progress', courseId, startedAt: new Date() },
            { upsert: true, new: true }
        );

        if (!Transcript) {
            throw new Error('Transcript model not found. Cannot fetch lecture content.');
        }

        // 2. Fetch transcript
        const transcript = await Transcript.findOne({ lectureId });
        if (!transcript || !transcript.content) {
            throw new Error(`Transcript not found or empty for lectureId: ${lectureId}`);
        }

        // 3. Split with RecursiveCharacterTextSplitter
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 200 });
        const chunks = await splitter.createDocuments([transcript.content]);
        const chunkTexts = chunks.map(c => c.pageContent);

        if (chunkTexts.length === 0) {
            throw new Error('Transcript resulted in 0 chunks.');
        }

        // 4. Batch embed
        const batchSize = 100;
        const totalChunks = chunkTexts.length;
        let upsertData = [];

        // Pre-calculate timestamps if needed
        const totalDurationSecs = transcript.totalDurationSecs || 0; // Assuming transcript object optionally has this

        for (let i = 0; i < chunkTexts.length; i += batchSize) {
            const batch = chunkTexts.slice(i, i + batchSize);
            
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: batch
            });

            // 5 & 6. Assemble vectors
            const batchVectors = batch.map((text, batchIndex) => {
                const globalIndex = i + batchIndex;
                const embedding = embeddingResponse.data[batchIndex].embedding;
                
                // Estimate timestamp if no exact match (simplified)
                let startTimestamp = 0;
                if (transcript.wordTimestamps && transcript.wordTimestamps.length > 0) {
                    // Very simplified approach; ideally map chunk back to word timestamps
                    startTimestamp = transcript.wordTimestamps[0].start; 
                } else {
                    startTimestamp = Math.floor((globalIndex / totalChunks) * totalDurationSecs);
                }

                return {
                    id: `${lectureId}-chunk-${globalIndex}`,
                    values: embedding,
                    metadata: {
                        lectureId: lectureId.toString(),
                        courseId: courseId.toString(),
                        chunkIndex: globalIndex,
                        startTimestamp,
                        text
                    }
                };
            });

            upsertData.push(...batchVectors);
        }

        // Upsert to Pinecone in batches
        for (let i = 0; i < upsertData.length; i += batchSize) {
            const batch = upsertData.slice(i, i + batchSize);
            await index.namespace(lectureId.toString()).upsert(batch);
        }

        // 7. Complete status
        await EmbeddingStatus.findOneAndUpdate(
            { lectureId },
            { 
                status: 'complete', 
                totalChunks, 
                completedAt: new Date(),
                errorReason: null
            }
        );

        return { success: true, lectureId, totalChunks };

    } catch (error) {
        console.error(`Embedding failed for lecture ${lectureId}:`, error);
        
        await EmbeddingStatus.findOneAndUpdate(
            { lectureId },
            { 
                status: 'failed', 
                errorReason: error.message || 'Unknown embedding error',
                courseId // Ensure courseId is set even on fail
            },
            { upsert: true }
        );

        throw error;
    }
}, { connection });

embeddingWorker.on('completed', job => {
    console.log(`Embedding job ${job.id} completed! Lecture: ${job.data?.lectureId}`);
});

embeddingWorker.on('failed', (job, err) => {
    console.error(`Embedding job ${job.id} failed:`, err.message);
});

module.exports = embeddingWorker;
