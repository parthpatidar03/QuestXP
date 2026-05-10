import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    Calendar, 
    ChevronRight, 
    Trophy, 
    Zap, 
    Sparkles, 
    Layout,
    Clock,
    Target
} from 'lucide-react';
import { getCurrentRoadmap } from '../../services/roadmapApi';
import { format, differenceInDays } from 'date-fns';

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



const StudyPlan = ({ courseId, onOpenSetup }) => {
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRoadmap = async () => {
        setLoading(true);
        try {
            const data = await getCurrentRoadmap(courseId);

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

    // Derived info for the preview
    const activeDay = useMemo(() => {
        if (!roadmap) return null;
        const currentDayIndex = Math.max(0, differenceInDays(new Date(), new Date(roadmap.config.startDate)));
        return roadmap.days[currentDayIndex] || roadmap.days[roadmap.days.length - 1];
    }, [roadmap]);

    const totalVideos = useMemo(() => {
        if (!roadmap) return 0;
        return roadmap.days.reduce((sum, day) => sum + day.plannedVideos.length, 0);
    }, [roadmap]);

    if (loading) {
        return <div className="glass-card p-8 animate-pulse bg-surface-2/50 h-40 rounded-2xl" />;
    }

    if (!roadmap) {
        return (
            <div className="glass-card p-8 border-dashed border-border flex flex-col items-center justify-center text-center group hover:border-primary/50 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Layout className="w-6 h-6 text-text-muted group-hover:text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1">No Study Roadmap</h3>
                <p className="text-xs text-text-muted mb-6 max-w-xs">
                    Generate an adaptive study roadmap to distribute your workload across days.
                </p>
                <button onClick={onOpenSetup} className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                    CREATE ROADMAP
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden border border-primary/20 relative group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="p-6 flex flex-col md:flex-row items-center gap-6 relative z-10">
                {/* Left: Day Indicator */}
                <div className="shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-surface-2 border border-border shadow-inner">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Day</span>
                    <span className="text-4xl font-black text-text-primary italic">{(activeDay?.dayIndex || 0) + 1}</span>
                </div>

                {/* Center: Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Active Journey</span>
                    </div>
                    <h3 className="text-xl font-black text-text-primary mb-3 tracking-tight truncate">
                        Adaptive Roadmap V2
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted">
                                <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-text-muted uppercase">Today's Load</p>
                                <p className="text-xs font-black text-text-primary">{formatTime(activeDay?.totalMinutes)}</p>


                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted">
                                <Target className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-text-muted uppercase">Videos</p>
                                <p className="text-xs font-black text-text-primary">{activeDay?.plannedVideos?.length || 0}</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted">
                                <Trophy className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-text-muted uppercase">Target</p>
                                <p className="text-xs font-black text-text-primary">{format(new Date(roadmap.days[roadmap.days.length - 1].date), 'MMM dd')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: CTA */}
                <div className="shrink-0 w-full md:w-auto">
                    <Link 
                        to={`/roadmap?courseId=${courseId}`}
                        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 group/btn"
                    >
                        VIEW FULL ROADMAP
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="h-1 w-full bg-surface-3">
                <div 
                    className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)]" 
                    style={{ width: `${Math.min(100, (((activeDay?.dayIndex || 0) + 1) / roadmap.days.length) * 100)}%` }} 
                />
            </div>
        </div>
    );
};

export default StudyPlan;
