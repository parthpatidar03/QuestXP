import React, { useState, useRef, useEffect } from 'react';
import { Info, Flame, Trophy } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function StreakCalendar({ history = [] }) {
    const { user } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showInfo, setShowInfo] = useState(false);
    const infoRef = useRef(null);

    // Close info popup on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (infoRef.current && !infoRef.current.contains(event.target)) {
                setShowInfo(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const calendarRef = useRef(null);

    const takeScreenshot = async () => {
        if (!calendarRef.current) return;
        
        try {
            const { toPng } = await import('html-to-image');
            const monthName = currentDate.toLocaleString('default', { month: 'long' });
            const fileName = `${user?.name || 'User'}-${monthName}-${year}.png`;
            
            // Temporary hide elements we don't want in screenshot
            const elementsToHide = calendarRef.current.querySelectorAll('.no-export');
            elementsToHide.forEach(el => el.style.opacity = '0');

            const dataUrl = await toPng(calendarRef.current, {
                cacheBust: true,
                backgroundColor: '#0a0a0a',
                style: {
                    borderRadius: '12px'
                }
            });
            
            elementsToHide.forEach(el => el.style.opacity = '1');

            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('oops, something went wrong!', err);
        }
    };

    return (
        <div ref={calendarRef} className="w-full max-w-[320px] mx-auto py-2 relative bg-surface p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 no-export">
                    <button 
                        onClick={() => setShowInfo(!showInfo)} 
                        className="w-8 h-8 rounded-full bg-surface-2 border border-white/5 flex items-center justify-center hover:bg-surface-3 transition-colors text-text-secondary hover:text-text-primary"
                        aria-label="Streak information"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={takeScreenshot}
                        className="w-8 h-8 rounded-full bg-surface-2 border border-white/5 flex items-center justify-center hover:bg-surface-3 transition-colors text-text-secondary hover:text-text-primary"
                        title="Download Calendar Screenshot"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="no-export w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors border border-white/5 text-text-secondary hover:text-text-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div className="px-4 py-1.5 rounded-full bg-surface-2 border border-white/5 text-sm font-semibold tracking-wide text-text-primary shadow-sm shadow-black/20 min-w-[100px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long' })}
                    </div>
                    <button onClick={nextMonth} className="no-export w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors border border-white/5 text-text-secondary hover:text-text-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                </div>
            </div>

            {/* Info Modal */}
            {showInfo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowInfo(false)}
                    />
                    {/* Modal Content */}
                    <div 
                        ref={infoRef}
                        className="relative z-10 w-full max-w-[340px] bg-surface border border-white/10 rounded-xl shadow-2xl p-6 text-sm"
                        style={{ background: 'var(--color-surface)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8)' }}
                    >
                    <div className="flex items-center gap-2 mb-3 text-text-primary font-semibold">
                        <Info className="w-4 h-4" />
                        Keep in mind:
                    </div>
                    <ol className="list-decimal list-outside ml-4 space-y-2 text-text-secondary text-xs leading-relaxed mb-4">
                        <li>
                            Only <span className="text-warning font-medium">completed lectures</span> or generating new courses counts.
                        </li>
                        <li>
                            Earning any amount of XP (greater than 0) will automatically extend your streak.
                        </li>
                    </ol>
                    <p className="text-xs text-text-muted mb-2">
                        Streaks are tracked based on <span className="text-warning font-medium">your local timezone (midnight)</span>.
                    </p>
                    <p className="text-xs text-text-muted mb-4">
                        Make sure your learning is done before then to count for the day!
                    </p>
                    <p className="text-xs text-text-secondary">
                        Thanks for your <span className="text-warning font-medium">dedication</span> - <br/>
                        <span className="text-text-primary font-semibold">Keep going and happy learning!</span>
                    </p>
                </div>
                </div>
            )}
            
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

            {/* Streak Stats Pill */}
            <div className="mt-8 flex items-center justify-center bg-surface-2 border border-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">Current</span>
                    <span className="text-lg">🔥</span>
                    <span className="font-bold text-text-primary">{user?.streak?.current || 0}</span>
                </div>
                <div className="w-px h-6 bg-border mx-4" />
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">Max</span>
                    <Trophy className="w-4 h-4 text-gold" />
                    <span className="font-bold text-text-primary">{user?.streak?.longest || 0}</span>
                </div>
            </div>
        </div>
    );
}
