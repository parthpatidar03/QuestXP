import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

/**
 * useLectureStatus hook polls for AI processing status of a specific lecture.
 * It stops polling once the status is 'completed' or 'failed'.
 * 
 * @param {string} lectureId - The ID of the lecture to poll status for.
 * @param {boolean} enabled - Whether to enable polling.
 * @returns {object} The current AI status of the lecture.
 */
export const useLectureStatus = (lectureId, enabled = true) => {
    const { isAuthenticated } = useAuthStore();

    const { data: status } = useQuery({
        queryKey: ['lectureStatus', lectureId],
        queryFn: async () => {
            const { data } = await api.get(`/lectures/${lectureId}/ai-status`);
            return data.aiStatus || {};
        },
        enabled: Boolean(lectureId && enabled && isAuthenticated),
        refetchInterval: (query) => {
            if (!query.state.data) return 5000;
            const aiStatus = query.state.data;
            const isFinished = Object.values(aiStatus).every(s => 
                s === 'completed' || s === 'failed' || s === 'ready'
            );
            return isFinished ? false : 5000;
        },
        refetchOnWindowFocus: false
    });

    return status || null;
};
