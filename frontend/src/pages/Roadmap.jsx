import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { 
    CheckCircle2, 
    Circle, 
    ChevronDown, 
    ChevronRight, 
    Calendar, 
    Clock, 
    Trophy, 
    Zap, 
    Plus, 
    Minus,
    ArrowLeft,
    Sparkles,
    Layout,
    Play,
    MinusCircle,
    PlusCircle,
    Square,
    CheckSquare,
    Loader2,
    Edit2
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0 min';
    const s = parseInt(seconds);
    if (s < 3600) {
        const m = s / 60;
        return `${m % 1 === 0 ? m : m.toFixed(1)} min`;
    }
    const h = s / 3600;
    return `${h % 1 === 0 ? h : h.toFixed(1)} hr`;
};


import { getCurrentRoadmap, adjustRoadmap, partialShiftRoadmap, toggleVideoCompletion, getAllRoadmaps, updateRoadmapTitle } from '../services/roadmapApi';
import { shootConfetti } from '../utils/confetti';
import NavBar from '../components/NavBar';
import { BGPattern } from '../components/ui/bg-pattern';
import GenerateRoadmapModal from '../components/Roadmap/GenerateRoadmapModal';
import useAuthStore from '../store/useAuthStore';

/* ── Components ──────────────────────────────────────────────────────── */
const ProgressHeader = ({ roadmap, onShift, totalCalendarDays, onUpdateTitle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(roadmap?.title || "Your Mastery Journey");

    if (!roadmap) return null;

    const handleTitleSave = () => {
        onUpdateTitle(tempTitle);
        setIsEditing(false);
    };
    
    const currentDayIndex = differenceInDays(new Date(), new Date(roadmap.config.startDate)) + 1;
    const progressPercent = Math.min(100, Math.max(0, (currentDayIndex / totalCalendarDays) * 100));

    return (
        <div className="glass-card p-6 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="w-24 h-24" />
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={tempTitle}
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                    className="bg-surface-3 border border-primary/50 text-text-primary px-3 py-1 rounded-lg font-black text-2xl focus:outline-none focus:ring-2 ring-primary/20"
                                    autoFocus
                                />
                                <button onClick={handleTitleSave} className="bg-primary p-2 rounded-lg text-white shadow-lg shadow-primary/20"><CheckSquare className="w-5 h-5" /></button>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 animate-pulse">Press Enter to Save</span>
                            </div>
                        ) : (
                            <h2 
                                onClick={() => setIsEditing(true)}
                                className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight leading-none cursor-pointer hover:text-primary transition-colors flex items-center gap-2" 
                                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                            >
                                {roadmap.title || "Your Mastery Journey"}
                                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <Edit2 className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">Rename</span>
                                </div>
                            </h2>
                        )}
                    </div>
                    {roadmap.days && roadmap.days.length > 0 && (
                        <p className="text-sm text-text-muted font-bold">
                            Targeting completion by <span className="text-primary">{format(new Date(roadmap.days[roadmap.days.length - 1].date), 'MMMM dd, yyyy')}</span> 🎯
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8">
                    {/* Schedule Adjuster */}
                    <div className="flex items-center gap-3 bg-surface-2 p-2 rounded-xl border border-border relative flex-1 sm:flex-none">
                        {onShift.adjusting && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-primary/20 text-primary text-[10px] font-black rounded-full border border-primary/30 animate-pulse z-20">
                                SYNCING...
                            </div>
                        )}
                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onShift(-1)}
                            className="p-2 hover:bg-surface-3 rounded-lg text-text-muted hover:text-primary transition-colors disabled:opacity-50"
                            title="Subtract 1 day"
                            disabled={onShift.adjusting}
                        >
                            <Minus className="w-4 h-4" />
                        </motion.button>
                        <div className="text-center min-w-[100px] flex-1">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">📅 Shift Plan</span>
                            <span className="text-sm font-black text-text-primary">Adjust Schedule</span>
                        </div>
                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onShift(1)}
                            className="p-2 hover:bg-surface-3 rounded-lg text-text-muted hover:text-primary transition-colors disabled:opacity-50"
                            title="Add 1 day"
                            disabled={onShift.adjusting}
                        >
                            <Plus className="w-4 h-4" />
                        </motion.button>
                    </div>

                    <div className="text-center sm:text-right sm:border-l sm:border-border/50 sm:pl-8 py-2">
                        <span className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">🔥 Time Progress</span>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <span className="text-3xl font-black text-text-primary italic leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Day {Math.max(1, currentDayIndex)}/{totalCalendarDays}</span>
                            <div className="w-full sm:w-32 h-3 rounded-full bg-surface-3 overflow-hidden border border-border relative">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)]" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RoadmapPlaylistCard = ({ playlistId, days, dayLabelsMap, totalCalendarDays, roadmapId, courseId, onPartialShift, onToggleCompletion }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const playlistName = useMemo(() => {
        for (const day of days) {
            const vid = day.plannedVideos.find(v => v.playlistId?.toString() === playlistId?.toString());
            if (vid) return vid.playlistName || "Learning Module";
        }
        return "Learning Module";
    }, [days, playlistId]);

    const totalVideos = useMemo(() => {
        return days.reduce((sum, day) => 
            sum + day.plannedVideos.filter(v => v.playlistId?.toString() === playlistId?.toString()).length, 0
        );
    }, [days, playlistId]);

    const filteredDays = useMemo(() => {
        return days.filter(d => d.plannedVideos.some(v => v.playlistId?.toString() === playlistId?.toString()));
    }, [days, playlistId]);

    const dateRange = useMemo(() => {
        if (filteredDays.length === 0) return "N/A";
        const start = format(new Date(filteredDays[0].date), 'MMM dd');
        const end = format(new Date(filteredDays[filteredDays.length - 1].date), 'MMM dd');
        return start === end ? start : `${start} — ${end}`;
    }, [filteredDays]);

    return (
        <div className="bg-surface/30 backdrop-blur-md mb-2 overflow-hidden border border-border/40 rounded-xl hover:border-primary/20 transition-all group">
            <div 
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-2 transition-colors select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* LEFT SIDE */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0 w-6 h-6 rounded-lg border border-primary/30 flex items-center justify-center bg-primary/10 group-hover:scale-110 transition-transform">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h3 className="text-base font-black text-text-primary tracking-tight truncate">
                        {playlistName} 
                        <span className="text-sm font-bold text-text-muted ml-3 opacity-60">({totalVideos} Missions)</span>
                    </h3>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-4 shrink-0">
                    <div 
                        className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-xl border border-border/80 shadow-inner"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.button 
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => { e.stopPropagation(); onPartialShift(days[0].dayIndex, -1); }}
                            className="text-text-muted hover:text-primary transition-all p-1 disabled:opacity-30"
                            disabled={onPartialShift.adjusting}
                        >
                            {onPartialShift.adjusting ? <Loader2 className="w-6 h-6 animate-spin opacity-50" /> : <MinusCircle className="w-6 h-6" />}
                        </motion.button>
                        <span className="text-sm font-black text-text-primary uppercase tracking-tight min-w-[130px] text-center font-mono">
                            {dateRange}
                        </span>
                        <motion.button 
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => { e.stopPropagation(); onPartialShift(days[0].dayIndex, 1); }}
                            className="text-text-muted hover:text-primary transition-all p-1 disabled:opacity-30"
                            disabled={onPartialShift.adjusting}
                        >
                            {onPartialShift.adjusting ? <Loader2 className="w-6 h-6 animate-spin opacity-50" /> : <PlusCircle className="w-6 h-6" />}
                        </motion.button>
                    </div>

                    <div className="p-1.5 rounded-lg text-text-muted group-hover:text-primary transition-colors">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="bg-black/10 border-t border-border/30 p-3 space-y-2">
                    {filteredDays.map((day, dIdx) => (
                        <div key={dIdx} className="p-4 rounded-xl bg-surface/50 border border-border/20">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]" />
                                    <span className="text-[12px] font-black uppercase tracking-[0.1em] text-text-primary italic">
                                        Day {dayLabelsMap.get(day.dayIndex)} — {format(new Date(day.date), 'EEEE, MMM dd')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-surface-2 rounded-xl border border-border overflow-hidden">
                                        <motion.button 
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onPartialShift(day.dayIndex, -1)}
                                            className="p-2.5 hover:bg-surface-3 text-text-muted hover:text-primary transition-colors border-r border-border disabled:opacity-50"
                                            disabled={onPartialShift.adjusting}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button 
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onPartialShift(day.dayIndex, 1)}
                                            className="p-2.5 hover:bg-surface-3 text-text-muted hover:text-primary transition-colors disabled:opacity-50"
                                            disabled={onPartialShift.adjusting}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                                        <span className="text-[11px] font-black text-primary uppercase tracking-tight">Target: {formatTime(day.totalMinutes)}</span>
                                    </div>


                                </div>
                            </div>
                            <div className="space-y-1.5 pl-4 border-l border-border/30 ml-0.5">
                                {day.plannedVideos.filter(v => v.playlistId?.toString() === playlistId?.toString()).map((vid, vIdx) => (
                                    <Link 
                                        key={vIdx} 
                                        to={`/courses/${vid.playlistId}/lectures/${vid.videoId}`}
                                        className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/5 transition-all group/item"
                                    >
                                        <Play className="w-2.5 h-2.5 text-primary opacity-70 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all" />
                                        <span className="text-xs font-bold text-text-primary flex-1 truncate group-hover/item:text-primary transition-colors">
                                            {vid.title}
                                        </span>

                                        <span className="text-[11px] font-bold text-text-muted tabular-nums">{formatTime(vid.duration)}</span>
                                        
                                        <motion.button
                                            whileTap={{ scale: 0.8 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onToggleCompletion(vid.videoId, !vid.completed);
                                            }}
                                            className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                                                vid.completed 
                                                    ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]' 
                                                    : 'bg-surface-3 border-border text-text-muted hover:border-primary/50 hover:text-primary'
                                            }`}
                                            title={vid.completed ? "Mark Incomplete" : "Mark as Done"}
                                        >
                                            {vid.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            <span className="text-[10px] font-black uppercase tracking-tighter px-1">
                                                {vid.completed ? 'Done' : 'Mark'}
                                            </span>
                                        </motion.button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const UniversalRoadmapCard = ({ roadmap }) => {
    const totalVideos = useMemo(() => {
        return (roadmap.days || []).reduce((sum, day) => sum + (day.plannedVideos?.length || 0), 0);
    }, [roadmap]);

    const totalMinutes = useMemo(() => {
        return (roadmap.days || []).reduce((sum, day) => sum + (day.totalMinutes || 0), 0);
    }, [roadmap]);

    const dateRange = useMemo(() => {
        if (!roadmap.days || roadmap.days.length === 0) return "Not started";
        const start = format(new Date(roadmap.days[0].date), 'MMM dd');
        const end = format(new Date(roadmap.days[roadmap.days.length - 1].date), 'MMM dd');
        return `${start} — ${end}`;
    }, [roadmap]);

    return (
        <Link 
            to={roadmap.courseId ? `/roadmap?courseId=${roadmap.courseId}` : `/roadmap`}
            className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-primary/40 transition-all hover:scale-[1.01]"
        >
            <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 sm:w-7 h-7" />
                </div>
                <div>
                    <h4 className="text-base sm:text-lg font-black text-text-primary mb-1 line-clamp-1">{roadmap.title || "Untitled Roadmap"}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-xs font-bold text-text-muted">
                        <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {totalVideos} Videos</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 
                            {totalMinutes >= 60 
                                ? `${(totalMinutes / 60).toFixed(1)} hrs` 
                                : `${Math.round(totalMinutes)} mins`}
                        </span>
                        <span className="flex items-center gap-1 text-primary/70">{dateRange}</span>
                    </div>
                </div>
            </div>
            <div className="self-end sm:self-center w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
            </div>
        </Link>
    );
};

/* ── Main Page ───────────────────────────────────────────────────────── */

const Roadmap = () => {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('courseId');
    
    const [roadmap, setRoadmap] = useState(null);
    const [allRoadmaps, setAllRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [modalCourseId, setModalCourseId] = useState(courseId);
    const [adjusting, setAdjusting] = useState(false);
    
    // T050: Debounce & Accumulation Logic for responsive +/- buttons
    const shiftTimeoutRef = useRef(null);
    const pendingShiftRef = useRef(0);
    const partialShiftTimeoutRef = useRef(null);
    const pendingPartialShiftsRef = useRef(new Map()); // dayIndex -> totalShift
    
    const { user } = useAuthStore();

    const fetchRoadmap = async () => {
        setLoading(true);
        try {
            if (courseId) {
                const data = await getCurrentRoadmap(courseId);
                setRoadmap(data);
            } else {
                const data = await getAllRoadmaps();
                setAllRoadmaps(data);
                setRoadmap(null);
            }
        } catch (err) {
            console.error("No active roadmap found");
            setRoadmap(null);
            setAllRoadmaps([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoadmap();
    }, [courseId]);

    const handleShift = (days) => {
        if (!roadmap) return;
        
        // Optimistic UI Update
        setRoadmap(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                days: prev.days.map(day => ({
                    ...day,
                    date: addDays(new Date(day.date), days).toISOString()
                })),
                config: {
                    ...prev.config,
                    startDate: addDays(new Date(prev.config.startDate), days).toISOString()
                }
            };
        });

        // Accumulate shift amount for API
        pendingShiftRef.current += days;
        setAdjusting(true);
        
        if (shiftTimeoutRef.current) clearTimeout(shiftTimeoutRef.current);
        
        shiftTimeoutRef.current = setTimeout(async () => {
            const finalShift = pendingShiftRef.current;
            pendingShiftRef.current = 0;
            
            if (finalShift === 0) {
                setAdjusting(false);
                return;
            }

            try {
                const updated = await adjustRoadmap(roadmap._id, finalShift);
                setRoadmap(updated);
            } catch (err) {
                console.error("Failed to shift roadmap", err);
                // In a real app, you'd revert the optimistic update here
                // but since it's a "vibe" refactor, we'll keep it simple
                // maybe just re-fetch the roadmap
                fetchRoadmap();
            } finally {
                setAdjusting(false);
            }
        }, 400);
    };
    
    const handlePartialShift = (fromDayIndex, shiftAmount) => {
        if (!roadmap) return;

        // Optimistic UI Update
        setRoadmap(prev => {
            if (!prev) return prev;
            const newDays = prev.days.map((day, idx) => {
                if (idx >= fromDayIndex) {
                    return {
                        ...day,
                        date: addDays(new Date(day.date), shiftAmount).toISOString()
                    };
                }
                return day;
            });
            const newConfig = fromDayIndex === 0 ? {
                ...prev.config,
                startDate: addDays(new Date(prev.config.startDate), shiftAmount).toISOString()
            } : prev.config;
            return { ...prev, days: newDays, config: newConfig };
        });

        // Accumulate for API
        const current = pendingPartialShiftsRef.current.get(fromDayIndex) || 0;
        pendingPartialShiftsRef.current.set(fromDayIndex, current + shiftAmount);
        setAdjusting(true);

        if (partialShiftTimeoutRef.current) clearTimeout(partialShiftTimeoutRef.current);

        partialShiftTimeoutRef.current = setTimeout(async () => {
            const entries = Array.from(pendingPartialShiftsRef.current.entries());
            pendingPartialShiftsRef.current.clear();

            for (const [idx, amt] of entries) {
                if (amt === 0) continue;
                try {
                    const updated = await partialShiftRoadmap(roadmap._id, idx, amt);
                    setRoadmap(updated);
                } catch (err) {
                    console.error("Failed to partially shift roadmap", err);
                    fetchRoadmap();
                }
            }
            setAdjusting(false);
        }, 400);
    };

    const handleToggleCompletion = async (videoId, completed) => {
        if (!roadmap) return;

        // Play confetti if marking as completed
        if (completed) {
            shootConfetti();
        }

        // Optimistic UI Update
        setRoadmap(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                days: prev.days.map(day => ({
                    ...day,
                    plannedVideos: day.plannedVideos.map(vid => 
                        vid.videoId === videoId ? { ...vid, completed } : vid
                    )
                }))
            };
        });

        try {
            const updated = await toggleVideoCompletion(roadmap._id, videoId, completed);
            setRoadmap(updated);
        } catch (err) {
            console.error("Failed to toggle video completion", err);
            // Re-fetch on error
            fetchRoadmap();
        }
    };

    const handleUpdateTitle = async (newTitle) => {
        if (!roadmap) return;
        setRoadmap(prev => ({ ...prev, title: newTitle }));
        try {
            await updateRoadmapTitle(roadmap._id, newTitle);
        } catch (err) {
            console.error("Failed to update title", err);
        }
    };

    // Attach adjusting state to handlers for sub-components
    handleShift.adjusting = adjusting;
    handlePartialShift.adjusting = adjusting;

    // Map each dayIndex to a "Calendar Day" number
    const dayLabelsMap = useMemo(() => {
        if (!roadmap || !roadmap.days) return new Map();
        const map = new Map();
        let currentDayLabel = 0;
        let lastDateString = null;
        
        roadmap.days.forEach((day, index) => {
            const dateString = format(new Date(day.date), 'yyyy-MM-dd');
            if (dateString !== lastDateString) {
                currentDayLabel++;
                lastDateString = dateString;
            }
            map.set(index, currentDayLabel);
        });
        return map;
    }, [roadmap]);

    const totalCalendarDays = useMemo(() => {
        if (!roadmap) return 0;
        const dates = new Set(roadmap.days.map(d => format(new Date(d.date), 'yyyy-MM-dd')));
        return dates.size;
    }, [roadmap]);

    const playlistIds = useMemo(() => {
        if (!roadmap || !roadmap.days) return [];
        const ids = new Set();
        roadmap.days.forEach(day => {
            if (day.plannedVideos) {
                day.plannedVideos.forEach(v => {
                    if (v.playlistId) ids.add(v.playlistId.toString());
                });
            }
        });
        return Array.from(ids);
    }, [roadmap]);

    if (loading) return (
        <div className="min-h-screen bg-bg">
            <NavBar />
            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-black text-text-muted uppercase tracking-widest">Loading Journey...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg text-text-primary">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-10" />
            <NavBar />

            <main className="max-w-4xl mx-auto px-4 py-12 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <Link to="/dashboard" className="inline-flex items-center gap-3 px-5 py-2.5 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl transition-all group w-fit">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                            <ArrowLeft className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-text-primary italic">Back to Hub</span>
                    </Link>

                    <button 
                        onClick={() => {
                            setModalCourseId(null);
                            setIsGenerateModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-primary text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        New Roadmap
                    </button>
                </div>
                
                {roadmap ? (
                    <>
                        <ProgressHeader 
                            roadmap={roadmap} 
                            onShift={handleShift} 
                            totalCalendarDays={totalCalendarDays}
                            onUpdateTitle={handleUpdateTitle}
                        />
                        
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Learning Milestones</h3>
                            <button 
                                onClick={() => {
                                    setModalCourseId(courseId);
                                    setIsGenerateModalOpen(true);
                                }}
                                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                            >
                                Regenerate Plan
                            </button>
                        </div>

                        <div className="space-y-4">
                            {playlistIds.map(id => (
                                <RoadmapPlaylistCard 
                                    key={id} 
                                    playlistId={id} 
                                    days={roadmap.days}
                                    dayLabelsMap={dayLabelsMap}
                                    totalCalendarDays={totalCalendarDays}
                                    roadmapId={roadmap._id}
                                    courseId={courseId}
                                    onPartialShift={handlePartialShift}
                                    onToggleCompletion={handleToggleCompletion}
                                />
                            ))}
                        </div>
                    </>
                ) : !courseId ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-text-primary tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Universal Roadmap</h2>
                                <p className="text-sm text-text-muted font-bold">Access all your active study plans from one place.</p>
                            </div>
                        </div>
                        
                        {allRoadmaps.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {allRoadmaps.map(rm => (
                                    <UniversalRoadmapCard key={rm._id} roadmap={rm} />
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card p-12 text-center">
                                <p className="text-text-muted font-bold">No roadmaps found. Start by creating one for any course!</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-card p-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-12">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                            <Layout className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight mb-3">No Active Roadmap</h2>
                        <p className="text-sm text-text-muted mb-8 leading-relaxed">
                            {courseId ? "This course doesn't have a specific roadmap yet." : "You haven't generated a study plan yet."} Generate a custom roadmap to start mastering these playlists.
                        </p>
                        <button 
                            onClick={() => {
                                setModalCourseId(courseId);
                                setIsGenerateModalOpen(true);
                            }}
                            className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                        >
                            <Sparkles className="w-4 h-4" />
                            CREATE MY ROADMAP
                        </button>
                    </div>
                )}
            </main>

            <GenerateRoadmapModal 
                isOpen={isGenerateModalOpen} 
                onClose={() => setIsGenerateModalOpen(false)}
                courseId={modalCourseId}
                onGenerated={(newRoadmap) => {
                    setRoadmap(newRoadmap);
                    setIsGenerateModalOpen(false);
                }}
            />
        </div>
    );
};

export default Roadmap;
