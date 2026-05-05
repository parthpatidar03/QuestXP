const { validationResult } = require('express-validator');
const EmbeddingStatus = require('../models/EmbeddingStatus');
const DoubtQuery = require('../models/DoubtQuery');
const DoubtAnswer = require('../models/DoubtAnswer');
const ragService = require('../services/ragService');
const { SchemaValidationError } = require('../schemas/ragAnswerSchema');
const redisConnection = require('../queues/redisConnection');

exports.status = async (req, res) => {
    try {
        const { lectureId } = req.params;

        const statusDoc = await EmbeddingStatus.findOne({ lectureId });

        if (!statusDoc) {
            return res.status(404).json({ error: 'Embedding status not found for this lecture.' });
        }

        res.json({
            lectureId: statusDoc.lectureId,
            embeddingStatus: statusDoc.status,
            totalChunks: statusDoc.totalChunks,
            errorReason: statusDoc.errorReason
        });
    } catch (error) {
        console.error('Error in doubtController.status:', error);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve doubt status' });
    }
};

exports.query = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { lectureId } = req.params;
        const { questionText } = req.body;
        const courseId = req.courseId || "60d5ec49c71b3e0015b6d9e1";

        // CHATBOT WALLET GUARD: 15 messages per hour
        const redis = redisConnection;
        const rateLimitKey = 'rate_limit:chatbot:global';
        const currentCount = await redis.get(rateLimitKey);

        if (currentCount && parseInt(currentCount) >= 15) {
            const ttl = await redis.ttl(rateLimitKey);
            return res.status(429).json({ 
                error: 'RATE_LIMIT_REACHED', 
                message: `Global Chatbot Limit Reached. Wallet Protected. Try again in ${Math.ceil(ttl/60)} mins.` 
            });
        }

        const doubtQuery = new DoubtQuery({
            userId: req.user.id,
            lectureId,
            courseId,
            questionText
        });
        await doubtQuery.save();

        const answerData = await ragService.queryLecture(lectureId, questionText);

        // Increment rate limit after successful generation
        if (!currentCount) {
            await redis.set(rateLimitKey, 1, 'EX', 3600); // 3600s = 1 hour
        } else {
            await redis.incr(rateLimitKey);
        }

        const doubtAnswer = new DoubtAnswer({
            queryId: doubtQuery._id,
            lectureId,
            answerText: answerData.answerText || "I couldn't find information about this in the current lecture.",
            citations: answerData.citations || [],
            chunksUsed: answerData.chunksUsed || [],
            notFound: answerData.notFound || false
        });
        await doubtAnswer.save();

        res.status(201).json({
            data: {
                queryId: doubtQuery._id,
                answerText: doubtAnswer.answerText,
                citations: doubtAnswer.citations,
                notFound: doubtAnswer.notFound,
                generatedAt: doubtAnswer.generatedAt
            }
        });

    } catch (error) {
        if (error instanceof SchemaValidationError) {
            console.error('[RAG ERROR] GPT generated malformed JSON:', error.message);
            return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Doubt chatbot temporarily unavailable — please try again.' });
        }
        console.error('Error in doubtController.query:', error);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Doubt chatbot temporarily unavailable — please try again.' });
    }
};

exports.history = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { lectureId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const queryOptions = { userId: req.user.id, lectureId };

        if (req.query.before) {
            queryOptions.createdAt = { $lt: new Date(req.query.before) };
        }

        const queries = await DoubtQuery.find(queryOptions)
            .sort({ createdAt: -1 })
            .limit(limit);

        const queryIds = queries.map(q => q._id);
        const answers = await DoubtAnswer.find({ queryId: { $in: queryIds } });

        // Map them together (and reverse to chronological order for the client)
        const exchanges = queries.reverse().map(q => {
            const answer = answers.find(a => a.queryId.toString() === q._id.toString());
            return {
                _id: q._id,
                questionText: q.questionText,
                createdAt: q.createdAt,
                answer: answer ? {
                    answerText: answer.answerText,
                    citations: answer.citations,
                    notFound: answer.notFound,
                    generatedAt: answer.generatedAt
                } : null
            };
        });

        res.json({
            data: {
                exchanges,
                total: exchanges.length,
                hasMore: exchanges.length === limit
            }
        });

    } catch (error) {
        console.error('Error in doubtController.history:', error);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve doubt history' });
    }
};
