import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Calendar, AlertTriangle, CheckCircle, Lock, CalendarDays, Zap, Trash2, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const StudyPlan = ({ courseId, onOpenSetup }) => {
    const [weeklyTargets, setWeeklyTargets] = useState([]);
    const [planStatus, setPlanStatus] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locked, setLocked] = useState(false);
    const [fullPlan, setFullPlan] = useState(null);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            // Fetch the plan to get over capacity and general status
            const planRes = await api.get(`/progress/${courseId}/plan`);
            const plan = planRes.data.plan;
            if (plan) {
                setPlanStatus(plan.scheduleStatus); // 'ahead', 'on_track', 'behind'
                setMessage(plan.scheduleMessage);
                setFullPlan(plan);
            }

            // Fetch the 4-week grid
            const { data } = await api.get(`/progress/${courseId}/plan/weekly`);
            setWeeklyTargets(data.weeklyTargets || []);
            setError(null);
        } catch (err) {
            if (err.response?.status === 403) {
                setLocked(true);
            } else if (err.response?.status === 409) {
                setError('Plan will be generated once course processing completes');
            } else if (err.response?.status === 404) {
                // 404 means the plan hasn't been created yet (but progress exists)
                setError('No study plan configured.');
            } else {
                setError('Failed to load study plan.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }
        fetchPlan();
    }, [courseId]);

    // Expose a way to manually refresh from parent if needed
    useEffect(() => {
        const handleRefresh = (e) => {
            if (e.detail?.courseId === courseId) {
                fetchPlan();
            }
        };
        window.addEventListener('refresh-plan', handleRefresh);
        return () => window.removeEventListener('refresh-plan', handleRefresh);
    }, [courseId]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this study plan?')) return;
        
        try {
            await api.delete(`/progress/${courseId}/plan`);
            // Refresh to show empty state
            fetchPlan();
            // Emit event in case parent needs to know
            window.dispatchEvent(new CustomEvent('refresh-plan', { detail: { courseId } }));
        } catch (err) {
            console.error('Failed to delete study plan:', err);
            alert('Failed to delete study plan.');
        }
    };

    const handleDownloadPdf = () => {
        const element = document.getElementById('study-plan-container');
        if (!element) return;
        
        const opt = {
            margin:       0.5,
            filename:     `StudyPlan-Course-${courseId}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0d0f1a' },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save();
    };

    // Calculate progression
    let totalDays = 0;
    let currentDay = 0;
    let progressPct = 0;

    if (fullPlan && fullPlan.dailyAllocations) {
        const allocs = fullPlan.dailyAllocations;
        totalDays = allocs.length;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todayIdx = allocs.findIndex(d => d.dateStr === todayStr);
        
        if (todayIdx !== -1) {
            currentDay = todayIdx + 1;
        } else if (allocs.length > 0 && new Date() > new Date(allocs[allocs.length - 1].date)) {
            currentDay = totalDays; // past the deadline
        } else {
            currentDay = 1; // before start
        }

        if (fullPlan.status === 'complete') {
           currentDay = totalDays;
        }

        progressPct = totalDays > 0 ? (currentDay / totalDays) * 100 : 0;
    }

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

    // T050: Error boundary state (e.g. COURSE_NOT_READY or manually not setup)
    if (error || weeklyTargets.length === 0) return (
        <div className="card border-border flex flex-col items-center justify-center text-center py-10">
            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                <CalendarDays className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-text-secondary text-sm mb-5">{error || 'No weekly plan available.'}</p>
            {onOpenSetup && (
                <button onClick={onOpenSetup} className="btn-esports text-sm py-2 px-5">
                    Create Study Plan
                </button>
            )}
        </div>
    );

    return (
        <div className="card relative overflow-hidden bg-surface border-border p-5" id="study-plan-container">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 relative z-10 w-full">
                <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0 hidden sm:block">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1 w-full max-w-md">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                                Progress
                            </h2>
                            <span className="text-sm font-bold text-primary">
                                {totalDays > 0 ? `🏆 Day ${currentDay}/${totalDays}` : 'Study Plan'}
                            </span>
                        </div>
                        {totalDays > 0 && (
                            <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${progressPct}%` }}></div>
                            </div>
                        )}
                        <div className="flex gap-4">
                            {planStatus === 'behind' && message && (
                                <p className="text-xs text-danger mt-1 flex items-center gap-1 font-semibold">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {message}
                                </p>
                            )}
                            {planStatus === 'ahead' && message && (
                                <p className="text-xs text-success mt-1 flex items-center gap-1 font-semibold">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button 
                        onClick={handleDownloadPdf}
                        className="btn-glass text-xs py-1.5 px-3 flex items-center gap-1.5"
                        title="Download PDF"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors border border-transparent hover:border-danger/20"
                        title="Delete Study Plan"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {weeklyTargets.map((week, idx) => {
                    const completed = week.completedCount || 0;
                    const total = (week.lectureIds || []).length;
                    const progressPct = total > 0 ? (completed / total) * 100 : 0;
                    const isAllDone = completed === total && total > 0;

                    return (
                        <div key={week.weekKey || idx} className={`relative p-4 rounded-xl border ${week.isCurrent ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'bg-surface-2 border-border'} transition-all flex flex-col`}>
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
