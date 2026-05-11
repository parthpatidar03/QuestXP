import { useState, useEffect } from 'react';
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
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (!lectureId || !enabled || !isAuthenticated) return;

        let cancelled = false;
        const fetchStatus = async () => {
            try {
                const { data } = await api.get(`/lectures/${lectureId}/ai-status`);
                if (!cancelled) {
                    const aiStatus = data.aiStatus || {};
                    setStatus(aiStatus);
                    
                    // Stop polling if all AI tasks are finished
                    const isFinished = Object.values(aiStatus).every(s => 
                        s === 'completed' || s === 'failed' || s === 'ready'
                    );
                    
                    if (isFinished) {
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error('[useLectureStatus] Error:', err);
            }
        };

        // Initial fetch
        fetchStatus();
        
        const interval = setInterval(fetchStatus, 3000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [lectureId, enabled]);

    return status;
};
