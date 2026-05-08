import { useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

const useHeartbeat = () => {
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user) return;

        let lastPing = Date.now();
        
        const sendHeartbeat = async () => {
            const now = Date.now();
            const deltaSeconds = Math.round((now - lastPing) / 1000);
            
            // Avoid spamming with 0s or negative
            if (deltaSeconds < 1) return;

            try {
                await api.post('/gamification/heartbeat', { seconds: deltaSeconds });
                lastPing = now; // Only update lastPing if request was successful or at least attempted
            } catch (err) {
                console.error('[Heartbeat] failed:', err);
            }
        };

        const interval = setInterval(sendHeartbeat, 30000); // Check every 30s

        // Also send heartbeat when user leaves the page
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                sendHeartbeat();
            } else {
                lastPing = Date.now(); // Reset start time when they come back
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', sendHeartbeat);

        return () => {
            clearInterval(interval);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', sendHeartbeat);
        };
    }, [user]);
};

export default useHeartbeat;
