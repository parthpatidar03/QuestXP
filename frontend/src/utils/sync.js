import { useEffect } from 'react';

export const broadcastProgressUpdate = () => {
    // Local tab event
    window.dispatchEvent(new CustomEvent('questxp_progress_updated'));
    
    // Cross-tab sync via localStorage
    localStorage.setItem('questxp_progress_sync', Date.now().toString());
};

export const useProgressSync = (onUpdate) => {
    useEffect(() => {
        const handleLocal = () => onUpdate();
        const handleStorage = (e) => {
            if (e.key === 'questxp_progress_sync') {
                onUpdate();
            }
        };

        window.addEventListener('questxp_progress_updated', handleLocal);
        window.addEventListener('storage', handleStorage);
        
        return () => {
            window.removeEventListener('questxp_progress_updated', handleLocal);
            window.removeEventListener('storage', handleStorage);
        };
    }, [onUpdate]);
};
