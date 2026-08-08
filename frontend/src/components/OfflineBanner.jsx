import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

// navigator.onLine only reflects the network interface, not real backend
// reachability, but it catches the common case (airplane mode, dead wifi)
// without adding a polling request.
export default function OfflineBanner() {
    const [online, setOnline] = useState(typeof navigator === 'undefined' || navigator.onLine);

    useEffect(() => {
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    if (online) return null;

    return (
        <div className="fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-danger animate-in slide-in-from-top duration-200">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            You're offline — changes won't save until your connection is back.
        </div>
    );
}
