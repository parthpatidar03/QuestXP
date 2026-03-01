import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Calendar, AlertTriangle, CheckCircle, Lock, CalendarDays, Zap } from 'lucide-react';

const StudyPlan = ({ courseId }) => {
    const [weeklyTargets, setWeeklyTargets] = useState([]);
    const [planStatus, setPlanStatus] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locked, setLocked] = useState(false);

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        const fetchPlan = async () => {
            try {
                // Fetch the plan to get over capacity and general status
                const planRes = await api.get(`/progress/${courseId}/plan`);
                const plan = planRes.data.plan;
                if (plan) {
                    setPlanStatus(plan.scheduleStatus); // 'ahead', 'on_track', 'behind'
                    setMessage(plan.scheduleMessage);
                }

                // Fetch the 4-week grid
                const { data } = await api.get(`/progress/${courseId}/plan/weekly`);
                setWeeklyTargets(data.weeklyTargets || []);
            } catch (err) {
                if (err.response?.status === 403) {
                    setLocked(true);
                } else if (err.response?.status === 404 || err.response?.status === 409) {
                    setError('Plan will be generated once course processing completes');
                } else {
                    setError('Failed to load study plan.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [courseId]);

    // T050: Loading state
    if (loading) return (
        <div className="card shadow-[0_0_20px_rgba(56,189,248,0.1)] skeleton min-h-[250px]"></div>
    );

    // T047: Locked state UI (visible, not hidden)
    if (locked) return (
        <div className="card border-dashed border-border flex flex-col items-center justify-center text-center py-10 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-1">Weekly Study Plan</h3>
            <p className="text-text-secondary text-sm max-w-[280px] leading-relaxed">
                Unlock the dynamically generated study plan at Level 3! Keep earning XP.
            </p>
            <div className="mt-5 w-32 h-1 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary/20 w-1/3"></div>
            </div>
            <span className="text-[10px] text-text-muted font-bold tracking-wider mt-2 uppercase">Level 3 Required</span>
        </div>
    );

    // T050: Error boundary state (e.g. COURSE_NOT_READY)
    if (error || weeklyTargets.length === 0) return (
        <div className="card border-border flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                <CalendarDays className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-text-secondary text-sm">{error || 'No weekly plan available.'}</p>
        </div>
    );

    return (
        <div className="card relative overflow-hidden bg-surface border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-display font-bold text-text-primary leading-tight">4-Week Plan</h2>
                        {planStatus === 'behind' && message && (
                            <p className="text-sm text-danger mt-1 flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="w-4 h-4" />
                                {message}
                            </p>
                        )}
                        {planStatus === 'ahead' && message && (
                            <p className="text-sm text-success mt-1 flex items-center gap-1.5 font-medium">
                                <CheckCircle className="w-4 h-4" />
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {weeklyTargets.map((week, idx) => {
                    const completed = week.completedCount || 0;
                    const total = (week.lectureIds || []).length;
                    const progressPct = total > 0 ? (completed / total) * 100 : 0;
                    const isAllDone = completed === total && total > 0;

                    return (
                        <div key={week.weekKey} className={`relative p-4 rounded-xl border ${week.isCurrent ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'bg-surface-2 border-border'} transition-all flex flex-col`}>
                            {week.isCurrent && (
                                <div className="absolute -top-2.5 right-4 bg-primary text-bg font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg">
                                    Current
                                </div>
                            )}
                            
                            <h4 className="text-sm font-semibold text-text-primary mb-3 truncate">{week.weekLabel}</h4>
                            
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-display font-bold text-text-primary leading-none">
                                        {completed}<span className="text-sm text-text-muted font-medium">/{total}</span>
                                    </span>
                                    <span className="text-xs text-text-secondary mt-1">lectures</span>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-warning">{week.totalMins}m</span>
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Target</span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-auto pt-2">
                                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mb-2">
                                    <div 
                                        className={`h-full ${isAllDone ? 'bg-success' : 'bg-primary'} transition-all duration-500`}
                                        style={{ width: `${progressPct}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <div className="font-medium text-warning flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        <span>{week.xpTarget || 100} XP</span>
                                    </div>
                                    {isAllDone && <span className="text-success font-medium">Done!</span>}
                                </div>
                            </div>
                            
                            {/* T047: overCapacityWarning badge */}
                            {week.overCapacityWarning && (
                                <div className="mt-3 p-2 bg-danger/10 text-danger border border-danger/20 rounded-lg flex items-start gap-1.5 text-xs">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                    <span className="leading-tight">Over daily limit</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudyPlan;
