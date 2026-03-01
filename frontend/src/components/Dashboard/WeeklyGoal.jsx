import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Target, Zap } from 'lucide-react';

const WeeklyGoal = ({ courseId }) => {
    const [weekData, setWeekData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        const fetchWeekly = async () => {
            try {
                const { data } = await api.get(`/progress/${courseId}/plan/weekly`);
                const targets = data.weeklyTargets || [];
                // Find current week
                const current = targets.find(w => w.isCurrent) || targets[0];
                if (current) setWeekData(current);
            } catch (err) {
                // Silently omit error as the StudyPlan component handles locked/error states too
                console.error('Failed to load weekly goal', err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeekly();
    }, [courseId]);

    if (loading) return (
        <div className="card skeleton min-h-[100px] flex flex-col items-center justify-center text-center p-4"></div>
    );

    if (!weekData) return (
        <div className="card flex flex-col items-center justify-center text-center p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-text-secondary uppercase tracking-wider">Weekly Goal</span>
            </div>
            <div className="text-xs text-text-muted font-mono mt-1">No plan</div>
        </div>
    );

    const completed = weekData.completedCount || 0;
    const total = (weekData.lectureIds || []).length;
    const pct = total > 0 ? (completed / total) * 100 : 0;
    const isDone = completed === total && total > 0;

    return (
        <div className="card flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
            {isDone && <div className="absolute inset-0 bg-success/5 border border-success/20 rounded-xl pointer-events-none"></div>}
            
            <div className="flex items-center justify-between w-full mb-3 relative z-10">
                <div className="flex items-center gap-1.5">
                    <Target className={`w-4 h-4 ${isDone ? 'text-success' : 'text-primary'}`} />
                    <span className="text-sm font-medium text-text-secondary uppercase tracking-wider">Weekly Goal</span>
                </div>
                <div className="font-bold text-xs text-warning flex items-center gap-0.5">
                    <Zap className="w-3 h-3" />
                    {weekData.xpTarget || 100}XP
                </div>
            </div>

            <div className="w-full relative z-10">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xl font-display font-bold text-text-primary leading-none">
                        {completed}<span className="text-sm text-text-muted">/{total}</span>
                    </span>
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Lectures</span>
                </div>

                <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden mb-1">
                    <div 
                        className={`h-full ${isDone ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(56,189,248,0.5)]'} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                    ></div>
                </div>
                {isDone && <p className="text-[10px] text-success font-bold tracking-wide mt-1.5">GOAL MET! You rock! 🎉</p>}
            </div>
        </div>
    );
};

export default WeeklyGoal;
