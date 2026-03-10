import api from './api';

/** GET /api/doubts/:lectureId/status — whether embeddings are ready */
export const getDoubtStatus = (lectureId) =>
    api.get(`/doubts/${lectureId}/status`).then(r => r.data);

/** POST /api/doubts/:lectureId/query — send a question, get AI answer */
export const queryDoubt = (lectureId, questionText) =>
    api.post(`/doubts/${lectureId}/query`, { questionText }).then(r => r.data);

/** GET /api/doubts/:lectureId/history — paginated chat history */
export const getDoubtHistory = (lectureId, { limit = 20, before } = {}) => {
    const params = { limit };
    if (before) params.before = before;
    return api.get(`/doubts/${lectureId}/history`, { params }).then(r => r.data);
};
