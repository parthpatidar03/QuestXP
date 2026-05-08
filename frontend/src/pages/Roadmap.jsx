import React, { useState, useEffect, useMemo } from 'react';
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
    Layout
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getCurrentRoadmap } from '../services/roadmapApi';
import NavBar from '../components/NavBar';
import { BGPattern } from '../components/ui/bg-pattern';
import GenerateRoadmapModal from '../components/Roadmap/GenerateRoadmapModal';
import useAuthStore from '../store/useAuthStore';

/* ── Components ──────────────────────────────────────────────────────── */

const ProgressHeader = ({ roadmap }) => {
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
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Active Roadmap</span>
                    </div>
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">Your Mastery Journey</h2>
                    <p className="text-sm text-text-muted font-medium">
                        Targeting completion by <span className="text-text-primary">{format(new Date(roadmap.days[roadmap.days.length - 1].date), 'MMMM dd, yyyy')}</span>
                    </p>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Time Progress</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-text-primary italic">Day {Math.max(1, currentDayIndex)}/{totalDays}</span>
                            <div className="w-24 h-2 rounded-full bg-surface-3 overflow-hidden border border-border">
                                <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RoadmapPlaylistCard = ({ playlistId, days, allVideosCompleted }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Derived info
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
        <div className="glass-card mb-4 overflow-hidden border border-border/50 hover:border-primary/30 transition-all">
            <div className="p-5 flex items-center gap-5">
                {/* Status Indicator */}
                <div className="shrink-0">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${allVideosCompleted ? 'bg-success/10 border-success/30 text-success shadow-lg shadow-success/10' : 'bg-surface-2 border-border text-text-muted'}`}>
                        {allVideosCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 opacity-40" />}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-text-primary tracking-tight truncate">{playlistName}</h3>
                        <span className="text-[10px] font-bold text-text-muted bg-surface-2 px-2 py-0.5 rounded border border-border uppercase">
                            {totalVideos} Videos
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-surface-3 overflow-hidden border border-border">
                            <div className="h-full bg-primary" style={{ width: '0%' }} /> {/* Placeholder for real progress */}
                        </div>
                        <span className="text-xs font-bold text-text-muted">0% Complete</span>
                    </div>
                </div>

                {/* Date Controls */}
                <div className="hidden md:flex items-center gap-4 px-6 border-x border-border/50 h-12">
                    <div className="text-right">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-0.5">Timeline</span>
                        <span className="text-sm font-black text-text-primary italic whitespace-nowrap">{dateRange}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button className="p-1 hover:bg-surface-3 rounded transition-colors text-text-muted hover:text-primary"><Plus className="w-3 h-3" /></button>
                        <button className="p-1 hover:bg-surface-3 rounded transition-colors text-text-muted hover:text-primary"><Minus className="w-3 h-3" /></button>
                    </div>
                </div>

                {/* Expand Toggle */}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-3 hover:bg-surface-3 rounded-xl transition-colors text-text-muted"
                >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
            </div>

            {/* Expanded Content: Daily Breakdown */}
            {isExpanded && (
                <div className="bg-surface-2/50 border-t border-border/50 p-4 space-y-3">
                    {days.filter(d => d.plannedVideos.some(v => v.playlistId === playlistId)).map((day, dIdx) => (
                        <div key={dIdx} className="p-4 rounded-xl bg-surface border border-border/40">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest text-text-primary">
                                        Day {day.dayIndex + 1} — {format(new Date(day.date), 'EEEE, MMM dd')}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-text-muted bg-surface-3 px-2 py-0.5 rounded">
                                    Target: {day.totalMinutes}m
                                </span>
                            </div>
                            <div className="space-y-2">
                                {day.plannedVideos.filter(v => v.playlistId === playlistId).map((vid, vIdx) => (
                                    <div key={vIdx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-2 transition-colors group">
                                        <Circle className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors" />
                                        <span className="text-sm font-medium text-text-secondary flex-1 truncate">{vid.title}</span>
                                        <span className="text-[10px] font-bold text-text-muted">{vid.duration}m</span>
                                    </div>
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
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const { user } = useAuthStore();

    const fetchRoadmap = async () => {
        try {
            const data = await getCurrentRoadmap();
            setRoadmap(data);
        } catch (err) {
            console.error("No active roadmap found");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoadmap();
    }, []);

    // Grouping by Playlist
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
                
                {roadmap ? (
                    <>
                        <ProgressHeader roadmap={roadmap} />
                        
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
                                    allVideosCompleted={false} 
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
                            You haven't generated a study plan yet. Pick your enrolled courses and our algorithm will build a custom roadmap for you.
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
                onGenerated={(newRoadmap) => {
                    setRoadmap(newRoadmap);
                    setIsGenerateModalOpen(false);
                }}
            />
        </div>
    );
};

export default Roadmap;
