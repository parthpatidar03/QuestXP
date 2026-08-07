import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Camera, Check, Download, X, Trophy } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const StreakInfoModal = ({ isOpen, onClose }) => {
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-2xl z-0"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[480px] bg-surface rounded-clay-xl overflow-hidden z-10 pointer-events-auto p-8 text-sm"
                    >
                        <div className="flex items-center gap-2 mb-4 text-text-primary font-black uppercase tracking-widest text-xs">
                            <Info className="w-4 h-4 text-primary" /> Streak Protocol
                        </div>
                        <ol className="list-decimal list-outside ml-4 space-y-3 text-text-secondary text-xs leading-relaxed mb-6 font-medium">
                            <li>Only <span className="text-warning font-bold">completed lectures</span> count toward streaks.</li>
                            <li>Earning any XP (greater than 0) extends your streak.</li>
                        </ol>
                        <p className="text-xs text-text-muted mb-6 leading-relaxed">Streaks are tracked based on your local timezone. Reset happens at midnight.</p>
                        <button type="button" onClick={onClose} className="w-full py-4 bg-primary hover:bg-primary-hover rounded-clay font-black uppercase tracking-widest text-[10px] text-white transition-all shadow-primary/20">Acknowledge</button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

const ShareAchievementModal = ({ 
    isOpen, 
    onClose, 
    exportRef, 
    handleDownload, 
    isExporting, 
    currentDate, 
    days,
    showUsername,
    setShowUsername,
    showRank,
    setShowRank,
    username,
    rank
}) => {
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-8">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-bg/80 backdrop-blur-2xl" 
                        onClick={onClose} 
                    />
                    <motion.div 
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10 w-full max-w-[480px] bg-[#0d0d0d] rounded-clay-xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pointer-events-auto"
                    >
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-clay-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-text-primary uppercase tracking-widest">Share Achievement</h3>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mt-0.5">High-Fidelity Capture</p>
                                </div>
                            </div>
                            <button type="button" onClick={onClose} className="w-12 h-12 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Export Canvas Area */}
                        <div className="p-6 bg-black overflow-y-auto max-h-[60vh] scrollbar-hide">
                            <div 
                                ref={exportRef}
                                className="bg-[#0a0a0a] border border-white/5 p-8 rounded-clay-lg relative overflow-hidden flex flex-col items-center"
                                style={{ width: '100%', minWidth: '340px' }}
                            >
                                <div className="px-5 py-1.5 rounded-full bg-white/5 text-xs font-black text-white uppercase tracking-[0.2em] mb-8">
                                    {currentDate.toLocaleString('default', { month: 'long' })}
                                </div>

                                <div className="w-full">
                                    <div className="grid grid-cols-7 gap-y-5 gap-x-2 text-center mb-6 opacity-40">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, idx) => (
                                            <div key={idx} className="text-[9px] font-black text-text-muted uppercase tracking-tighter">{d}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
                                        {days.map((d, i) => (
                                            <div key={i} className={`flex items-center justify-center h-8 text-[11px] font-black ${d.type === 'current' ? 'text-text-primary' : 'text-white/5'}`}>
                                                {d.display ? <span className="text-xl leading-none">{d.display}</span> : d.num}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5">
                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Current</span>
                                        <span className="text-xs font-black text-white">Streak Stats</span>
                                    </div>
                                    
                                    {showUsername && (
                                        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Learner</span>
                                            <span className="text-xs font-black text-white">{username || 'Explorer'}</span>
                                        </div>
                                    )}

                                    {showRank && rank && (
                                        <div className="flex items-center gap-2 bg-warning/5 border border-warning/20 rounded-full px-4 py-1.5">
                                            <span className="text-[10px] font-black text-warning uppercase tracking-widest">Rank</span>
                                            <span className="text-xs font-black text-white">#{rank}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex flex-col items-center gap-1.5">
                                    <div className="text-[11px] font-black text-primary uppercase tracking-[0.4em] drop-shadow-[0_0_12px_rgba(34,197,94,0.3)]">QuestXP Protocol</div>
                                    <div className="text-[7px] font-bold text-text-muted/60 uppercase tracking-widest">Verification ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                                </div>
                            </div>

                            {/* Options Area */}
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between px-4">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Configuration</span>
                                    <div className="h-px flex-1 bg-white/5 mx-4" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setShowUsername(!showUsername)}
                                        className={`flex items-center justify-between p-4 rounded-clay-lg border transition-all ${showUsername ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white/[0.02] border-white/5 text-text-muted'}`}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest mb-1">Username</span>
                                            <span className="text-[11px] font-bold">{showUsername ? 'Visible' : 'Hidden'}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${showUsername ? 'bg-primary border-primary text-white' : 'border-white/10'}`}>
                                            {showUsername && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => setShowRank(!showRank)}
                                        className={`flex items-center justify-between p-4 rounded-clay-lg border transition-all ${showRank ? 'bg-warning/5 border-warning/20 text-warning' : 'bg-white/[0.02] border-white/5 text-text-muted'}`}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest mb-1">Rank Position</span>
                                            <span className="text-[11px] font-bold">{showRank ? 'Visible' : 'Hidden'}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${showRank ? 'bg-warning border-warning text-white' : 'border-white/10'}`}>
                                            {showRank && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                            <button
                                onClick={handleDownload}
                                disabled={isExporting}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-[0_8px_32px_rgba(34,197,94,0.3)] group"
                            >
                                {isExporting ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                                        Capture achievement
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default function StreakCalendar({ history = [], rank }) {
    const { user } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showInfo, setShowInfo] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // Achievement Share Options
    const [showUsername, setShowUsername] = useState(true);
    const [showRank, setShowRank] = useState(true);

    const exportRef = useRef(null);

    const xpByDate = {};
    history.forEach(d => { xpByDate[d.date] = d.totalXP; });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push({ type: 'prev', num: prevMonthLastDay - startingDayOfWeek + i + 1 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const joinDate = user?._id ? new Date(parseInt(user._id.substring(0, 8), 16) * 1000) : new Date();

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        d.setHours(0, 0, 0, 0);

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

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
        days.push({ type: 'next', num: i });
    }

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    const handleDownload = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        
        try {
            const { toPng } = await import('html-to-image');
            const monthName = currentDate.toLocaleString('default', { month: 'long' });
            const fileName = `QuestXP-${user?.name || 'User'}-${monthName}.png`;
            
            const dataUrl = await toPng(exportRef.current, { 
                cacheBust: true,
                backgroundColor: '#0a0a0a',
                pixelRatio: 2,
                style: {
                    borderRadius: '0px'
                }
            });
            
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setShowShareModal(false);
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full max-w-[320px] mx-auto py-2 relative bg-surface p-4 rounded-clay-lg">
            {/* Header: [Info] [Month Controls] [Camera] */}
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => setShowInfo(true)} 
                    className="w-8 h-8 rounded-full bg-surface-2 border border-white/5 flex items-center justify-center hover:bg-surface-3 transition-colors text-text-secondary hover:text-text-primary pointer-events-auto cursor-pointer"
                    style={{ position: 'relative', zIndex: 50 }}
                >
                    <Info className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors border border-white/5 text-text-secondary hover:text-text-primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div className="px-3 py-1 rounded-full bg-surface-2 border border-white/5 text-xs font-bold tracking-tight text-text-primary min-w-[80px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long' })}
                    </div>
                    <button onClick={nextMonth} className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors border border-white/5 text-text-secondary hover:text-text-primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                </div>

                <button 
                    onClick={() => setShowShareModal(true)}
                    className="w-8 h-8 rounded-full bg-surface-2 border border-white/5 flex items-center justify-center hover:bg-surface-3 transition-colors text-text-secondary hover:text-text-primary pointer-events-auto cursor-pointer"
                    style={{ position: 'relative', zIndex: 50 }}
                    title="Share Achievement"
                >
                    <Camera className="w-4 h-4" />
                </button>
            </div>


            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-4">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                    <div key={idx} className="text-[10px] font-black text-text-muted uppercase tracking-widest">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
                {days.map((d, i) => (
                    <div key={i} className={`flex items-center justify-center h-8 text-sm font-bold ${d.type === 'current' ? 'text-text-primary' : 'text-text-muted/10'}`}>
                        {d.display ? (
                            <span className="text-xl" title={d.num}>{d.display}</span>
                        ) : (
                            d.num
                        )}
                    </div>
                ))}
            </div>

            {/* Streak Stats Pill */}
            <div className="mt-8 flex items-center justify-center bg-surface-2 border border-white/5 rounded-clay px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-text-muted uppercase">Current</span>
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-bold text-text-primary">{user?.streak?.current || 0}</span>
                </div>
                <div className="w-px h-6 bg-border mx-4" />
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-text-muted uppercase">Max</span>
                    <Trophy className="w-4 h-4 text-gold" />
                    <span className="text-sm font-bold text-text-primary">{user?.streak?.longest || 0}</span>
                </div>
            </div>

            {/* Modals */}
            <StreakInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
            <ShareAchievementModal 
                isOpen={showShareModal} 
                onClose={() => setShowShareModal(false)}
                exportRef={exportRef}
                handleDownload={handleDownload}
                isExporting={isExporting}
                currentDate={currentDate}
                days={days}
                showUsername={showUsername}
                setShowUsername={setShowUsername}
                showRank={showRank}
                setShowRank={setShowRank}
                username={user?.username || user?.name}
                rank={rank}
            />
        </div>
    );
}
