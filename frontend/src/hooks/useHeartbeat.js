import { useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

const useHeartbeat = () => {
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user) return;

        // Send first heartbeat immediately on mount/login
        const sendHeartbeat = async () => {
            try {
                await api.post('/gamification/heartbeat');
            } catch (err) {
                console.error('[Heartbeat] failed:', err);
            }
        };

        sendHeartbeat();

        const interval = setInterval(sendHeartbeat, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [user]);
};

export default useHeartbeat;
