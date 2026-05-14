const { Worker } = require('bullmq');
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const aiProvider = require('../services/ai-provider');
const Transcript = require('../models/Transcript');
const EmbeddingStatus = require('../models/EmbeddingStatus');
const Course = require('../models/Course');
const connection = require('../queues/redisConnection');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = process.env.PINECONE_INDEX_NAME || 'questxp';

const embeddingWorker = new Worker('embedding', async job => {
    const { lectureId, courseId } = job.data;

    try {
        // T027 [P] Implement atomic index rebuild - delete namespace before processing
        const index = pc.Index(indexName);
        console.log(`Clearing existing vectors for lecture ${lectureId}`);
        try {
            await index.namespace(lectureId.toString()).deleteAll();
        } catch (deleteError) {
            const isMissingNamespace = deleteError.status === 404
                || deleteError.response?.status === 404
                || String(deleteError.message || '').includes('status 404');
            if (!isMissingNamespace) throw deleteError;
        }

        // 1. Set status in progress
        await EmbeddingStatus.findOneAndUpdate(
            { lectureId },
            { status: 'in_progress', courseId, startedAt: new Date() },
            { upsert: true, new: true }
        );
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.embedding': 'in_progress' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        if (!Transcript) {
            throw new Error('Transcript model not found. Cannot fetch lecture content.');
        }

        // 2. Fetch transcript
        const transcript = await Transcript.findOne({ lecture: lectureId });
        if (!transcript || !transcript.fullText) {
            throw new Error(`Transcript not found or empty for lectureId: ${lectureId}`);
        }

        // 3. Split with RecursiveCharacterTextSplitter
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 200 });
        const chunks = await splitter.createDocuments([transcript.fullText]);
        const chunkTexts = chunks.map(c => c.pageContent);

        if (chunkTexts.length === 0) {
            throw new Error('Transcript resulted in 0 chunks.');
        }

        // 4. Batch embed
        const batchSize = 100;
        const totalChunks = chunkTexts.length;
        let upsertData = [];

        // Pre-calculate timestamps if needed
        const totalDurationSecs = transcript.durationSecs || 0;

        for (let i = 0; i < chunkTexts.length; i += batchSize) {
            const batch = chunkTexts.slice(i, i + batchSize);
            
            let batchEmbeddings;
            try {
                batchEmbeddings = await aiProvider.generateBatchEmbeddings(batch);
            } catch (embedError) {
                console.error(`[EmbeddingWorker] OpenAI Embedding failed: ${embedError.message}`);
                throw embedError;
            }

            // 5 & 6. Assemble vectors
            const batchVectors = batch.map((text, batchIndex) => {
                const globalIndex = i + batchIndex;
                const embedding = batchEmbeddings[batchIndex];
                
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

        console.log(`[EmbeddingWorker] Total vectors generated: ${upsertData.length} for lecture ${lectureId}`);
        
        // Upsert to Pinecone in batches
        if (upsertData.length === 0) {
            throw new Error(`No vectors generated for lecture ${lectureId}. Transcript might be too short or splitter failed.`);
        }

        const ns = index.namespace(lectureId.toString());

        for (let i = 0; i < upsertData.length; i += batchSize) {
            const batch = upsertData.slice(i, i + batchSize);
            
            // Validate batch content to prevent PineconeArgumentError
            const validBatch = batch.filter(v => v && v.id && v.values && Array.isArray(v.values) && v.values.length > 0);
            
            if (validBatch.length > 0) {
                console.log(`[EmbeddingWorker] Upserting batch of ${validBatch.length} to namespace ${lectureId}`);
                await ns.upsert(validBatch);
            } else {
                console.warn(`[EmbeddingWorker] Skipping empty or invalid batch at index ${i}`);
            }
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
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.embedding': 'complete' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
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
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { 
                $set: { 
                    'sections.$[].lectures.$[lec].aiStatus.embedding': 'failed',
                    'sections.$[].lectures.$[lec].aiStatus.errorReason': error.message || 'Unknown embedding error'
                }
            },
            { arrayFilters: [{ 'lec._id': lectureId }] }
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
