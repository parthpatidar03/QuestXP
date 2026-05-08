import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';

export default function StreakCalendar({ history = [] }) {
    const { user } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());

    const xpByDate = {};
    history.forEach(d => { xpByDate[d.date] = d.totalXP; });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Mon=0, Sun=6
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push({ type: 'prev', num: prevMonthLastDay - startingDayOfWeek + i + 1 });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Derive join date
    const joinDate = user?._id ? new Date(parseInt(user._id.substring(0, 8), 16) * 1000) : new Date();

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        d.setHours(0, 0, 0, 0); // normalize time

        const key = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        const isToday = d.getTime() === today.getTime();
        const isPast = d.getTime() < today.getTime();
        
        let isBeforeJoin = false;
        if (joinDate) {
            const normalizedJoinDate = new Date(joinDate);
            normalizedJoinDate.setHours(0, 0, 0, 0);
            isBeforeJoin = d.getTime() < normalizedJoinDate.getTime();
        }

        const xp = xpByDate[key] || 0;
        
        let display = null;
        if (isPast && xp > 0) display = '🔥';
        else if (isPast && xp === 0 && !isBeforeJoin) display = '🥹';
        else if (isToday && xp > 0) display = '🔥';
        else if (isToday && xp === 0) display = '⏱️';
        
        days.push({ type: 'current', num: i, display, key });
    }

    // Next month padding
    const remainingCells = 42 - days.length; // 6 rows of 7
    for (let i = 1; i <= remainingCells; i++) {
        days.push({ type: 'next', num: i });
    }

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    return (
        <div className="w-full max-w-[320px] mx-auto py-2">
            <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors border border-white/5 text-text-secondary hover:text-text-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="px-4 py-1.5 rounded-full bg-surface-2 border border-white/5 text-sm font-semibold tracking-wide text-text-primary shadow-sm shadow-black/20">
                    {currentDate.toLocaleString('default', { month: 'long' })}
                </div>
                <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors border border-white/5 text-text-secondary hover:text-text-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="text-xs font-medium text-text-secondary">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
                {days.map((d, i) => (
                    <div key={i} className={`flex items-center justify-center h-8 text-sm font-semibold ${d.type === 'current' ? 'text-text-primary' : 'text-text-muted/30'}`}>
                        {d.display ? (
                            <span className="text-xl" title={d.num}>{d.display}</span>
                        ) : (
                            d.num
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
