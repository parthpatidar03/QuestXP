import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    Zap, 
    Target, 
    ChevronRight,
    Play
} from 'lucide-react';
import { getCurrentRoadmap } from '../../services/roadmapApi';
import { format, isSameDay } from 'date-fns';

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



const DailyMissionWidget = () => {
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                const data = await getCurrentRoadmap();
                setRoadmap(data);
            } catch (err) {
                // 404 = no roadmap yet, totally expected for new users
                if (err.response?.status !== 404) {
                    console.error("[DailyMissionWidget] Error fetching roadmap:", err.message);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchRoadmap();
    }, []);

    const todayMission = useMemo(() => {
        if (!roadmap) return null;
        const now = new Date();
        return roadmap.days.find(day => isSameDay(new Date(day.date), now));
    }, [roadmap]);

    if (loading) return (
        <div className="glass-card p-6 h-40 animate-pulse bg-surface-2/50" />
    );

    if (!roadmap || !todayMission) return (
        <div className="glass-card p-6 border-border flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-xs text-text-muted">No mission active today.</p>
            <Link to="/roadmap" className="text-[10px] font-black text-primary uppercase mt-2 hover:underline">Set a Goal</Link>
        </div>
    );

    return (
        <div className="glass-card p-0 overflow-hidden group border-primary/20 bg-gradient-to-br from-surface to-surface-2">
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-clay-sm bg-primary/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">Today's Mission</h3>
                    </div>
                    <span className="text-[10px] font-bold text-text-muted">{format(new Date(), 'EEEE, MMM dd')}</span>
                </div>

                <div className="space-y-3 mb-5">
                    {todayMission.plannedVideos.length > 0 ? (
                        todayMission.plannedVideos.slice(0, 2).map((vid, i) => (
                            <Link 
                                key={i} 
                                to={`/courses/${vid.playlistId}/lectures/${vid.videoId}`}
                                className="flex items-center gap-3 p-2.5 rounded-clay bg-surface-3/50 clay-sm hover:border-primary hover:bg-surface-3 transition-all group/item"
                            >
                                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                    <Play className="w-3 h-3 text-primary fill-primary group-hover/item:text-white group-hover/item:fill-white" />
                                </div>
                                <span className="text-[11px] font-bold text-text-primary truncate flex-1 group-hover/item:text-primary transition-colors">{vid.title}</span>
                                <span className="text-[10px] font-black text-text-muted">{formatTime(vid.duration)}</span>
                            </Link>
                        ))

                    ) : (
                        <div className="py-2 text-center">
                            <p className="text-[11px] text-success font-black uppercase italic">Rest Day - Recharge!</p>
                        </div>
                    )}
                    {todayMission.plannedVideos.length > 2 && (
                        <p className="text-[9px] text-text-muted text-center italic">+ {todayMission.plannedVideos.length - 2} more missions</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Daily Target</span>
                        {/* totalMinutes is in minutes; formatTime takes seconds */}
                        <span className="text-sm font-black text-text-primary italic">{formatTime((todayMission.totalMinutes || 0) * 60)}</span>


                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Reward</span>
                        <span className="text-sm font-black text-success italic">+ 250 XP</span>
                    </div>
                </div>
            </div>

            <Link 
                to="/roadmap"
                className="w-full py-3 bg-primary/10 hover:bg-primary/20 border-t border-primary/20 text-center text-[10px] font-black text-primary uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
            >
                OPEN PLANNER <ChevronRight className="w-3 h-3" />
            </Link>
        </div>
    );
};

export default DailyMissionWidget;
