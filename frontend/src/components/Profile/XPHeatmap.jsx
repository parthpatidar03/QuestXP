import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/useAuthStore';

const XPHeatmap = () => {
    const { token } = useAuthStore();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const url = import.meta.env.VITE_API_URL 
                    ? `${import.meta.env.VITE_API_URL}/api/gamification/xp-history`
                    : 'http://localhost:5000/api/gamification/xp-history';
                    
                const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (err) {
                console.error("Failed to fetch XP heatmap:", err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchHistory();
    }, [token]);

    // Build exactly 30 days grid
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const record = history.find(h => h.date === dateStr);
        days.push({
            date: dateStr,
            xp: record ? record.totalXP : 0,
            label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        });
    }

    const maxXP = Math.max(...days.map(d => d.xp), 1); // Avoid div by 0

    const getOpacity = (xp) => {
        if (xp === 0) return 0.05;
        // Map xp to 0.3 - 1.0 based on maxXP
        return 0.3 + (0.7 * (xp / maxXP));
    };

    if (loading) return null;

    return (
        <div className="bg-surface-2 border border-border rounded-xl p-6 mb-6 overflow-hidden">
            <h3 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider">30-Day Activity Heatmap</h3>
            <div className="flex gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                {days.map(day => (
                    <div 
                        key={day.date}
                        className="group relative flex flex-col items-center gap-1 min-w-[32px]"
                    >
                        <div 
                            className="w-8 h-8 rounded-md transition-all duration-300"
                            style={{ 
                                backgroundColor: day.xp > 0 ? 'rgb(56, 189, 248)' : 'rgb(51, 65, 85)',
                                opacity: day.xp > 0 ? getOpacity(day.xp) : 1
                            }}
                        />
                        <div className="text-[9px] text-text-muted">{day.label.split(' ')[1]}</div>
                        
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-border text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            <span className="font-bold text-primary">{day.xp} XP</span> on {day.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default XPHeatmap;
