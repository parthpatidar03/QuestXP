import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Target, Brain, X, Maximize2, Minimize2, Edit3, Check, ChevronRight, ChevronLeft } from 'lucide-react';

const MODES = {
    FOCUS: { label: 'Focus', time: 25 * 60, icon: Brain, color: 'var(--color-primary)' },
    SHORT: { label: 'Break', time: 5 * 60, icon: Coffee, color: 'var(--color-success)' },
    LONG: { label: 'Long', time: 15 * 60, icon: Target, color: 'var(--color-gold)' }
};

const PomodoroTimer = () => {
    const [isOpen, setIsOpen] = useState(() => {
        const saved = localStorage.getItem('pomodoro_isOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isHidden, setIsHidden] = useState(() => {
        const saved = localStorage.getItem('pomodoro_isHidden');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [mode, setMode] = useState('FOCUS');
    const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.time);
    const [isActive, setIsActive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [customMins, setCustomMins] = useState('25');
    
    const timerRef = useRef(null);
    const audioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handleTimerComplete();
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    useEffect(() => {
        localStorage.setItem('pomodoro_isOpen', JSON.stringify(isOpen));
    }, [isOpen]);

    useEffect(() => {
        localStorage.setItem('pomodoro_isHidden', JSON.stringify(isHidden));
    }, [isHidden]);

    const handleTimerComplete = () => {
        setIsActive(false);
        audioRef.current.play().catch(() => {});
        if (Notification.permission === 'granted') {
            new Notification('Session Complete!', {
                body: mode === 'FOCUS' ? 'Time for a break!' : 'Ready to focus?',
                icon: '/favicon.png'
            });
        }
    };

    const toggleTimer = () => setIsActive(!isActive);
    
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode].time);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setTimeLeft(MODES[newMode].time);
        setIsActive(false);
        setIsEditing(false);
    };

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        const mins = parseInt(customMins);
        if (!isNaN(mins) && mins > 0) {
            setTimeLeft(mins * 60);
            setIsEditing(false);
            setIsActive(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = (timeLeft / (parseInt(customMins || 25) * 60)) * 100;
    const ActiveIcon = MODES[mode].icon;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {isOpen && !isHidden && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="glass-card p-5 w-72 pointer-events-auto border-primary/20 shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Progress Glow */}
                        <div 
                            className="absolute bottom-0 left-0 h-1 transition-all duration-1000" 
                            style={{ 
                                width: `${100 - (timeLeft / (parseInt(customMins || 25) * 60)) * 100}%`, 
                                backgroundColor: MODES[mode].color,
                                boxShadow: `0 0 20px ${MODES[mode].color}`
                            }} 
                        />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-surface-2 border border-border">
                                    <ActiveIcon className="w-4 h-4" style={{ color: MODES[mode].color }} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-text-primary">
                                    {MODES[mode].label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-surface-2 rounded-lg transition-colors text-text-muted"
                                    title="Minimize"
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setIsHidden(true)}
                                    className="p-1.5 hover:bg-surface-2 rounded-lg transition-colors text-text-muted"
                                    title="Hide"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-8 relative group">
                            {isEditing ? (
                                <form onSubmit={handleCustomSubmit} className="flex items-center justify-center gap-2">
                                    <input 
                                        autoFocus
                                        type="number"
                                        value={customMins}
                                        onChange={(e) => setCustomMins(e.target.value)}
                                        className="w-24 text-4xl font-black bg-surface-2 border border-primary rounded-lg text-center text-text-primary outline-none"
                                        onBlur={handleCustomSubmit}
                                    />
                                    <span className="text-xl font-bold text-text-muted">min</span>
                                </form>
                            ) : (
                                <div className="relative inline-block">
                                    <h2 className="text-5xl font-black text-text-primary tracking-tighter tabular-nums">
                                        {formatTime(timeLeft)}
                                    </h2>
                                    <button 
                                        onClick={() => { setIsEditing(true); setIsActive(false); }}
                                        className="absolute -top-2 -right-6 p-1.5 rounded-full bg-surface-2 border border-border opacity-0 group-hover:opacity-100 transition-all hover:text-primary"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-2">
                                {isActive ? 'Session Active' : 'Paused'}
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 mb-6">
                            <button 
                                onClick={resetTimer}
                                className="p-3 rounded-full bg-surface-2 border border-border text-text-secondary hover:text-text-primary transition-all active:scale-90"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={toggleTimer}
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                disabled={isEditing}
                                style={{ backgroundColor: MODES[mode].color, boxShadow: `0 8px 24px ${MODES[mode].color}40` }}
                            >
                                {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                            <button 
                                onClick={() => { setIsEditing(!isEditing); setIsActive(false); }}
                                className={`p-3 rounded-full border transition-all active:scale-90 ${isEditing ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-2 border-border text-text-secondary'}`}
                            >
                                <Edit3 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex p-1 bg-surface-2 rounded-xl border border-border">
                            {Object.entries(MODES).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => switchMode(key)}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === key ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && !isHidden && (
                <motion.div
                    layoutId="timer-pill"
                    className="flex items-center gap-2 pointer-events-auto"
                >
                    <button
                        onClick={() => setIsOpen(true)}
                        className="glass-card flex items-center gap-3 px-4 py-3 border-primary/30 shadow-xl group hover:border-primary transition-colors"
                    >
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-white animate-pulse' : 'bg-surface-2 text-text-muted'}`}>
                            <Brain className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-black text-text-primary leading-none tabular-nums">
                                {formatTime(timeLeft)}
                            </p>
                            <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest mt-1">
                                {isActive ? 'Keep Focusing' : 'Start Focus'}
                            </p>
                        </div>
                        <div className="ml-2 p-1 rounded-md bg-surface-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-3 h-3 text-text-muted" />
                        </div>
                    </button>
                    <button 
                        onClick={() => setIsHidden(true)}
                        className="glass-card p-3 border-primary/30 shadow-xl hover:border-primary transition-colors text-text-muted"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </motion.div>
            )}
            <AnimatePresence>
                {isHidden && (
                    <motion.button
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        onClick={() => setIsHidden(false)}
                        className="fixed bottom-48 right-0 z-[110] glass-card p-3 rounded-l-2xl rounded-r-none border-r-0 border-primary/40 pointer-events-auto hover:bg-primary/10 transition-colors group"
                    >
                        <div className="relative">
                            <ChevronLeft className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                            {isActive && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                            )}
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PomodoroTimer;
