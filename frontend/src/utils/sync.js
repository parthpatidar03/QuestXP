import { useEffect } from 'react';

// Tab-unique ID persistent across reloads
export const getTabId = () => {
    if (typeof window === 'undefined') return 'server';
    if (!window.name || window.name === '') {
        window.name = 'qxp_' + Math.random().toString(36).substring(2, 11);
    }
    return window.name;
};

export const broadcastProgressUpdate = (sourceId = getTabId()) => {
    const event = new CustomEvent('questxp_progress_updated', { detail: { sourceId } });
    window.dispatchEvent(event);
    localStorage.setItem('questxp_progress_sync', JSON.stringify({
        timestamp: Date.now(),
        sourceId
    }));
};

export const useProgressSync = (onUpdate) => {
    useEffect(() => {
        const handleLocal = (e) => onUpdate(e.detail?.sourceId);
        const handleStorage = (e) => {
            if (e.key === 'questxp_progress_sync') {
                try {
                    const data = JSON.parse(e.newValue);
                    onUpdate(data.sourceId);
                } catch (_) {
                    onUpdate();
                }
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
