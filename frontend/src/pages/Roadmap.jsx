import React, { useState, useEffect, useMemo } from 'react';
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
    Square
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getCurrentRoadmap, adjustRoadmap, partialShiftRoadmap } from '../services/roadmapApi';
import NavBar from '../components/NavBar';
import { BGPattern } from '../components/ui/bg-pattern';
import GenerateRoadmapModal from '../components/Roadmap/GenerateRoadmapModal';
import useAuthStore from '../store/useAuthStore';

/* ── Components ──────────────────────────────────────────────────────── */

const ProgressHeader = ({ roadmap, onShift }) => {
    if (!roadmap) return null;
    
    const totalDays = roadmap.days.length;
    const currentDayIndex = differenceInDays(new Date(), new Date(roadmap.config.startDate)) + 1;
    const progressPercent = Math.min(100, Math.max(0, (currentDayIndex / totalDays) * 100));

    return (
        <div className="glass-card p-6 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="w-24 h-24" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">🗺️ Active Roadmap</span>
                    </div>
                    <h2 className="text-3xl font-black text-text-primary tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Your Mastery Journey</h2>
                    <p className="text-sm text-text-muted font-bold">
                        Targeting completion by <span className="text-primary">{format(new Date(roadmap.days[roadmap.days.length - 1].date), 'MMMM dd, yyyy')}</span> 🎯
                    </p>
                </div>

                <div className="flex items-center gap-8">
                    {/* Schedule Adjuster */}
                    <div className="flex items-center gap-3 bg-surface-2 p-2 rounded-xl border border-border">
                        <button 
                            onClick={() => onShift(-1)}
                            className="p-2 hover:bg-surface-3 rounded-lg text-text-muted hover:text-primary transition-colors"
                            title="Subtract 1 day"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="text-center min-w-[100px]">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">📅 Shift Plan</span>
                            <span className="text-sm font-black text-text-primary">Adjust Schedule</span>
                        </div>
                        <button 
                            onClick={() => onShift(1)}
                            className="p-2 hover:bg-surface-3 rounded-lg text-text-muted hover:text-primary transition-colors"
                            title="Add 1 day"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-right border-l border-border/50 pl-8">
                        <span className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">🔥 Time Progress</span>
                        <div className="flex items-center gap-4">
                            <span className="text-3xl font-black text-text-primary italic" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Day {Math.max(1, currentDayIndex)}/{totalDays}</span>
                            <div className="w-32 h-3 rounded-full bg-surface-3 overflow-hidden border border-border relative">
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

const RoadmapPlaylistCard = ({ playlistId, days, roadmapId, courseId, onPartialShift }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const playlistName = useMemo(() => {
        for (const day of days) {
            const vid = day.plannedVideos.find(v => v.playlistId === playlistId);
            if (vid) return vid.playlistName || "Learning Module";
        }
        return "Learning Module";
    }, [days, playlistId]);

    const totalVideos = useMemo(() => {
        return days.reduce((sum, day) => 
            sum + day.plannedVideos.filter(v => v.playlistId === playlistId).length, 0
        );
    }, [days, playlistId]);

    const dateRange = useMemo(() => {
        const pDays = days.filter(d => d.plannedVideos.some(v => v.playlistId === playlistId));
        if (pDays.length === 0) return "N/A";
        const start = format(new Date(pDays[0].date), 'MMM dd');
        const end = format(new Date(pDays[pDays.length - 1].date), 'MMM dd');
        return start === end ? start : `${start} — ${end}`;
    }, [days, playlistId]);

    return (
        <div className="bg-surface/30 backdrop-blur-md mb-2 overflow-hidden border border-border/40 rounded-xl hover:border-primary/20 transition-all group">
            <div className="p-4 flex items-center justify-between gap-4">
                {/* LEFT SIDE */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0 w-6 h-6 rounded-lg border border-primary/30 flex items-center justify-center bg-primary/10">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h3 className="text-base font-black text-text-primary tracking-tight truncate">
                        {playlistName} 
                        <span className="text-sm font-bold text-text-muted ml-3 opacity-60">({totalVideos} Missions)</span>
                    </h3>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-xl border border-border/80 shadow-inner">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPartialShift(days[0].dayIndex, -1); }}
                            className="text-text-muted hover:text-primary transition-all p-1 hover:scale-110 active:scale-90"
                        >
                            <MinusCircle className="w-6 h-6" />
                        </button>
                        <span className="text-sm font-black text-text-primary uppercase tracking-tight min-w-[130px] text-center font-mono">
                            {dateRange}
                        </span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPartialShift(days[0].dayIndex, 1); }}
                            className="text-text-muted hover:text-primary transition-all p-1 hover:scale-110 active:scale-90"
                        >
                            <PlusCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-surface-3 rounded-lg transition-colors text-text-muted"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="bg-black/10 border-t border-border/30 p-3 space-y-2">
                    {days.filter(d => d.plannedVideos.some(v => v.playlistId === playlistId)).map((day, dIdx) => (
                        <div key={dIdx} className="p-4 rounded-xl bg-surface/50 border border-border/20">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]" />
                                    <span className="text-[12px] font-black uppercase tracking-[0.1em] text-text-primary italic">
                                        Day {day.dayIndex + 1} — {format(new Date(day.date), 'EEEE, MMM dd')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-surface-2 rounded-xl border border-border overflow-hidden">
                                        <button 
                                            onClick={() => onPartialShift(day.dayIndex, -1)}
                                            className="p-2.5 hover:bg-surface-3 text-text-muted hover:text-primary transition-colors border-r border-border"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => onPartialShift(day.dayIndex, 1)}
                                            className="p-2.5 hover:bg-surface-3 text-text-muted hover:text-primary transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                                        <span className="text-[11px] font-black text-primary uppercase tracking-tight">Target: {day.totalMinutes}m</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5 pl-4 border-l border-border/30 ml-0.5">
                                {day.plannedVideos.filter(v => v.playlistId === playlistId).map((vid, vIdx) => (
                                    <Link 
                                        key={vIdx} 
                                        to={`/courses/${vid.playlistId}/lectures/${vid.videoId}`}
                                        className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/5 transition-all group/item"
                                    >
                                        <Play className="w-2.5 h-2.5 text-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        <span className="text-xs font-medium text-text-secondary flex-1 truncate group-hover/item:text-text-primary transition-colors">
                                            {vid.title}
                                        </span>
                                        <span className="text-[11px] font-bold text-text-muted tabular-nums">{vid.duration}m</span>
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

/* ── Main Page ───────────────────────────────────────────────────────── */

const Roadmap = () => {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('courseId');
    
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [adjusting, setAdjusting] = useState(false);
    
    const { user } = useAuthStore();

    const fetchRoadmap = async () => {
        try {
            const data = await getCurrentRoadmap(courseId);
            setRoadmap(data);
        } catch (err) {
            console.error("No active roadmap found");
            setRoadmap(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoadmap();
    }, [courseId]);

    const handleShift = async (days) => {
        if (!roadmap || adjusting) return;
        setAdjusting(true);
        try {
            const updated = await adjustRoadmap(roadmap._id, days);
            setRoadmap(updated);
        } catch (err) {
            console.error("Failed to shift roadmap", err);
        } finally {
            setAdjusting(false);
        }
    };

    const handlePartialShift = async (fromDayIndex, shiftAmount) => {
        if (!roadmap || adjusting) return;
        setAdjusting(true);
        try {
            const updated = await partialShiftRoadmap(roadmap._id, fromDayIndex, shiftAmount);
            setRoadmap(updated);
        } catch (err) {
            console.error("Failed to partially shift roadmap", err);
        } finally {
            setAdjusting(false);
        }
    };

    const playlistIds = useMemo(() => {
        if (!roadmap) return [];
        const ids = new Set();
        roadmap.days.forEach(day => {
            day.plannedVideos.forEach(v => ids.add(v.playlistId));
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
                <Link to="/dashboard" className="inline-flex items-center gap-3 px-5 py-2.5 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl transition-all group mb-8 w-fit">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                        <ArrowLeft className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-text-primary italic">Back to Hub</span>
                </Link>
                
                {roadmap ? (
                    <>
                        <ProgressHeader roadmap={roadmap} onShift={handleShift} />
                        
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Learning Milestones</h3>
                            <button 
                                onClick={() => setIsGenerateModalOpen(true)}
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
                                    roadmapId={roadmap._id}
                                    courseId={courseId}
                                    onPartialShift={handlePartialShift}
                                />
                            ))}
                        </div>
                    </>
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
                            onClick={() => setIsGenerateModalOpen(true)}
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
                courseId={courseId}
                onGenerated={(newRoadmap) => {
                    setRoadmap(newRoadmap);
                    setIsGenerateModalOpen(false);
                }}
            />
        </div>
    );
};

export default Roadmap;
