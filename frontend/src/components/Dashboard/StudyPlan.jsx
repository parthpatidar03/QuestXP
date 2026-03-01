import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Target, Lock, PlayCircle, Clock, CheckCircle } from 'lucide-react';

const StudyPlan = () => {
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const { data } = await api.get('/plan/today');
                setPlan(data.plan);
            } catch (err) {
                if (err.response?.status === 403) {
                    setError('Unlock the Study Plan feature at Level 3! Keep earning XP.');
                } else {
                    setError('Failed to load study plan.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    if (loading) return (
        <div className="card border-primary/30 shadow-[0_0_20px_rgba(56,189,248,0.1)] skeleton min-h-[150px]"></div>
    );

    if (error) return (
        <div className="card border-dashed border-border flex flex-col items-center justify-center text-center py-8 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="text-text-secondary text-sm max-w-[250px] leading-relaxed">
                {error}
            </p>
            {/* Locked feature visual indicator */}
            <div className="mt-4 w-32 h-1 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary/20 w-1/3"></div>
            </div>
            <span className="text-[10px] text-text-muted font-bold tracking-wider mt-2 uppercase">Level 3 Required</span>
        </div>
    );

    if (!plan || !plan.courses || plan.courses.length === 0) return (
        <div className="card flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-1">All Caught Up!</h3>
            <p className="text-text-secondary text-sm">You have no scheduled lectures for today.</p>
        </div>
    );

    return (
        <div className="card relative overflow-hidden border-primary/50 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-primary/20">
            {/* Background Accent Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-display font-bold text-text-primary leading-tight">Today's Target</h2>
                        <p className="text-sm text-text-secondary">{plan.totalPlannedMinutes} mins targeted</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                {plan.courses.map((item, idx) => (
                    <Link 
                        key={idx}
                        to={`/courses/${item.courseId}/lectures/${item.lectureId}`}
                        className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-lg bg-surface-2 border border-border hover:border-primary/50 transition-colors gap-4"
                    >
                        <div className="flex-1 min-w-0 flex items-start gap-3">
                            <div className="mt-0.5 text-text-muted group-hover:text-primary transition-colors">
                                <PlayCircle className="w-5 h-5" />
                            </div>
                            <div className="max-w-full overflow-hidden">
                                <h4 className="text-text-primary font-semibold text-sm truncate group-hover:text-primary transition-colors pr-4">{item.courseTitle}</h4>
                                <p className="text-xs text-text-secondary truncate mt-0.5 max-w-[90%]">{item.lectureTitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0 flex-shrink-0 bg-surface sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-md border border-border sm:border-transparent">
                            <Clock className="w-3.5 h-3.5 text-warning sm:hidden" />
                            <span className="text-warning font-display font-bold text-sm">~{item.plannedMinutes}m</span>
                            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase hidden sm:block mt-0.5">EST</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default StudyPlan;
