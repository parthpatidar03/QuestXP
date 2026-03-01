const EmbeddingStatus = require('../models/EmbeddingStatus');

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
