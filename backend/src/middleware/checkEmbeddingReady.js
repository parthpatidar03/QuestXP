const EmbeddingStatus = require('../models/EmbeddingStatus');

const checkEmbeddingReady = async (req, res, next) => {
    try {
        const { lectureId } = req.params;

        if (!lectureId) {
            return res.status(400).json({ error: 'Missing lectureId parameter' });
        }

        const statusDoc = await EmbeddingStatus.findOne({ lectureId });

        if (!statusDoc) {
            // Treat missing explicitly as not ready (since we depend on its presence to serve RAG)
            return res.status(503).json({ error: 'EMBEDDING_IN_PROGRESS', message: 'Lecture embedding has not started yet.' });
        }

        if (statusDoc.status === 'pending' || statusDoc.status === 'in_progress') {
            return res.status(503).json({ error: 'EMBEDDING_IN_PROGRESS', message: 'Doubt chatbot is currently processing this lecture.' });
        }

        if (statusDoc.status === 'failed') {
            return res.status(503).json({ error: 'EMBEDDING_FAILED', message: 'Doubt chatbot unavailable for this lecture due to a processing error.' });
        }

        if (statusDoc.status === 'complete') {
            return next();
        }

        return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Unknown embedding status' });
    } catch (error) {
        console.error('Error in checkEmbeddingReady middleware:', error);
        return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Doubt chatbot temporarily unavailable' });
    }
};

module.exports = checkEmbeddingReady;
