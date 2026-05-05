import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import NavBar from '../components/NavBar';
import StudyPlan from '../components/Dashboard/StudyPlan';
import SetupPlanModal from '../components/Dashboard/SetupPlanModal';
import {
    ArrowLeft, PlayCircle, Loader2, AlertOctagon, Clock,
    BookOpen, Layers, Zap, Lock, CheckCircle2, ChevronRight,
    MessageSquareText, StickyNote, BarChart3, ChevronDown
} from 'lucide-react';

import { BGPattern } from '../components/ui/bg-pattern';

/* ── helpers ────────────────────────────────────────────────────────── */
const XP_PER_LECTURE = 50;
const fmtDuration = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
};

/* ── Lecture Mission Row ────────────────────────────────────────────── */
function MissionRow({ lecture, index, isCompleted, isActive, isLocked, courseId }) {
    return (
        <Link
            to={isLocked ? '#' : `/courses/${courseId}/lectures/${lecture._id}`}
            className={`flex items-center gap-4 px-5 py-4 border-b border-border transition-all group ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface-2/60'}`}
            onClick={e => isLocked && e.preventDefault()}
        >
            {/* Hex mission number */}
            <div
                className="hex-clip w-9 h-9 flex items-center justify-center text-xs font-black shrink-0"
                style={{ 
                    background: isCompleted ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-surface-2)', 
                    color: isLocked ? 'var(--color-text-muted)' : '#fff' 
                }}
            >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-4 h-4" /> : index + 1}
            </div>

            {/* Thumbnail (small) */}
            <div className="relative w-16 h-10 rounded overflow-hidden shrink-0 bg-surface-3">
                {lecture.thumbnailUrl
                    ? <img src={lecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    : <PlayCircle className="w-5 h-5 m-auto mt-2 text-text-muted" />}
                {!isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <PlayCircle className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>

            {/* Title + Duration */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug line-clamp-2 ${isActive ? 'text-primary' : 'text-text-primary'} group-hover:text-primary transition-colors`}>
                    {lecture.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" /> {fmtDuration(lecture.duration)}
                    </span>
                    {isActive && (
                        <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary animate-pulse">
                            ACTIVE
                        </span>
                    )}
                </div>
            </div>

            {/* XP chip */}
            <div className="xp-chip shrink-0">
                <Zap className="w-3 h-3" /> +{XP_PER_LECTURE}
            </div>
        </Link>
    );
}

/* ── CourseDetail ───────────────────────────────────────────────────── */
const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [progress, setProgress] = useState(null);
    const [statusData, setStatusData] = useState(null);
    const [error, setError] = useState(null);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});

    const toggleSection = (index) => {
        setCollapsedSections(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };


    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [cRes, pRes] = await Promise.allSettled([
                    api.get(`/courses/${courseId}`),
                    api.get(`/progress/${courseId}`)
                ]);
                if (cRes.status === 'fulfilled') setCourse(cRes.value.data.course);
                else setError('Failed to load course.');
                if (pRes.status === 'fulfilled' && pRes.value.data.progress)
                    setProgress(pRes.value.data.progress);
            } catch (_) { setError('Failed to load.'); }
        };
        fetchAll();
    }, [courseId]);

    // Poll status if processing
    useEffect(() => {
        if (!course || course.status === 'ready' || course.status === 'error') return;
        const iv = setInterval(async () => {
            try {
                const { data } = await api.get(`/courses/${courseId}/status`);
                setStatusData(data);
                if (data.status === 'ready' || data.status === 'error') {
                    setCourse(p => ({ ...p, status: data.status }));
                    if (data.status === 'ready') {
                        const r = await api.get(`/courses/${courseId}`);
                        setCourse(r.data.course);
                    }
                    clearInterval(iv);
                }
            } catch (_) {}
        }, 3000);
        return () => clearInterval(iv);
    }, [course, courseId]);

    /* ── Loading / Error states ─── */
    if (error) return (
        <div className="min-h-screen bg-bg">
            <NavBar />
            <div className="flex flex-col items-center justify-center py-32">
                <AlertOctagon className="w-14 h-14 mb-4 text-danger" />
                <p className="text-text-primary font-bold text-lg mb-6">{error}</p>
                <Link to="/dashboard" className="btn-primary">Return to Dashboard</Link>
            </div>
        </div>
    );

    if (!course) return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    if (course.status === 'processing') {
        const processed = statusData?.processedCount || 0;
        const total = statusData?.totalCount || '…';
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-bg">
                <div className="glass-card max-w-md w-full text-center p-10">
                    <div className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-surface-2 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                        <BookOpen className="w-8 h-8 text-primary absolute" />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Synthesizing Quest</h2>
                    <p className="text-sm mb-8 text-text-secondary">Analyzing playlist, extracting metadata, building your mission list…</p>
                    <div className="bg-surface-2 rounded-xl p-4 border border-border">
                        <div className="flex justify-between items-center mb-2 text-xs">
                            <span className="font-semibold text-text-primary">Processing Missions</span>
                            <span className="text-text-muted">{processed} / {total}</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar__fill skeleton" style={{ width: total && total !== '…' ? `${(processed / total) * 100}%` : '8%' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (course.status === 'error') return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-bg">
            <div className="glass-card max-w-md w-full text-center p-10" style={{ borderColor: 'var(--color-danger)' }}>
                <AlertOctagon className="w-14 h-14 mx-auto mb-6 text-danger" />
                <h2 className="text-2xl font-black mb-3 text-text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Quest Failed</h2>
                <p className="text-sm mb-8 text-text-secondary">Could not process playlist. Ensure URLs are public YouTube playlists.</p>
                <Link to="/dashboard" className="btn-esports w-full block">Return to Dashboard</Link>
            </div>
        </div>
    );

    /* ── Derived data ─── */
    const allLectures = course.sections.flatMap(s => s.lectures);
    const completedSet = new Set(progress?.completedLectures || []);
    const completedCount = allLectures.filter(l => completedSet.has(l._id)).length;
    const pct = allLectures.length ? Math.round((completedCount / allLectures.length) * 100) : 0;
    const totalXpPool = allLectures.length * XP_PER_LECTURE;
    const totalDurMins = Math.floor((course.totalDuration || 0) / 60);
    const heroThumb = course.sections?.[0]?.lectures?.[0]?.thumbnailUrl;

    // First incomplete lecture for "Start / Resume"
    let startLec = null;
    outer: for (const sec of course.sections) {
        for (const lec of sec.lectures) {
            if (!completedSet.has(lec._id)) { startLec = lec; break outer; }
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-bg">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-primary)" className="opacity-5 z-0" />
            <NavBar />

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

                {/* Back link */}
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-6 group transition-colors text-text-secondary">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-primary" />
                    Back to Library
                </Link>

                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── Left: Hero + Mission List ── */}
                    <div className="flex-1 min-w-0">

                        {/* Hero Banner */}
                        <div
                            className="relative rounded-2xl overflow-hidden mb-6 border border-primary/20"
                            style={{
                                background: heroThumb
                                    ? `linear-gradient(to right, var(--color-bg) 40%, transparent 100%),  url(${heroThumb}) right center / cover no-repeat`
                                    : 'linear-gradient(135deg, var(--color-surface), var(--color-surface-2))',
                                minHeight: 200,
                            }}
                        >
                            <div className="relative z-10 p-7">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="badge-epic">EPIC</span>
                                    <span className="text-xs text-text-secondary">{allLectures.length} Missions · {totalDurMins}m</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-text-primary mb-4 leading-tight max-w-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                                    {course.title}
                                </h1>
                                <div className="flex items-center gap-3 flex-wrap mb-5">
                                    <div className="xp-chip text-sm px-3 py-1"><Zap className="w-4 h-4" /> {totalXpPool} XP Available</div>
                                    <div className="text-xs font-semibold text-success">{pct}% Complete</div>
                                </div>
                                {startLec && (
                                    <div className="flex gap-3 mt-4">
                                        <Link
                                            to={`/courses/${courseId}/lectures/${startLec._id}`}
                                            className="btn-esports inline-flex items-center gap-2"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            {completedCount > 0 ? 'Resume Mission' : 'Start Quest'}
                                        </Link>
                                        <Link 
                                            to={`/courses/${courseId}/roadmap`} 
                                            className="btn-glass inline-flex items-center gap-2 px-5 py-2.5 bg-surface-2 hover:bg-surface-3 transition-colors rounded-lg text-sm font-bold text-text-primary border border-border"
                                        >
                                            <Layers className="w-4 h-4 text-primary" />
                                            View Roadmap
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4-Week Study Plan */}
                        <div className="mb-6">
                            <StudyPlan courseId={courseId} onOpenSetup={() => setShowSetupModal(true)} />
                        </div>

                        {/* Mission List */}
                        <div className="glass-card overflow-hidden" style={{ padding: 0 }}>
                            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                                <Layers className="w-4 h-4 text-primary" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">Mission List</h2>
                                <div className="ml-auto text-xs text-text-muted">{completedCount}/{allLectures.length} complete</div>
                            </div>

                            {course.sections.map((section, sIdx) => {
                                const isCollapsed = !!collapsedSections[sIdx];
                                return (
                                    <div key={sIdx} className="border-b border-border last:border-0">
                                        {course.sections.length > 1 && (
                                            <button 
                                                onClick={() => toggleSection(sIdx)}
                                                className="w-full px-5 py-3 text-xs font-bold uppercase tracking-widest bg-surface-2/40 text-text-muted flex items-center justify-between hover:bg-surface-2 transition-colors group"
                                            >
                                                <span>Section {sIdx + 1}: {section.title}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
                                            </button>
                                        )}
                                        <AnimatePresence initial={false}>
                                            {!isCollapsed && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="overflow-hidden"
                                                >
                                                    {section.lectures.map((lec, lIdx) => {
                                                        const globalIdx = course.sections.slice(0, sIdx).reduce((a, s) => a + s.lectures.length, 0) + lIdx;
                                                        const isDone = completedSet.has(lec._id);
                                                        const isActive = !isDone && startLec?._id === lec._id;
                                                        const isLocked = !isDone && !isActive && false;

                                                        return (
                                                            <MissionRow
                                                                key={lec._id}
                                                                lecture={lec}
                                                                index={globalIdx}
                                                                isCompleted={isDone}
                                                                isActive={isActive}
                                                                isLocked={isLocked}
                                                                courseId={courseId}
                                                            />
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}

                        </div>
                    </div>

                    {/* ── Right Sidebar ── */}
                    <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">

                        {/* Course Stats */}
                        <div className="glass-card p-5 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-text-secondary">Quest Stats</h3>
                            {[
                                { icon: <Layers className="w-4 h-4" />, label: 'Total Missions', val: allLectures.length },
                                { icon: <Clock className="w-4 h-4" />, label: 'Duration', val: `${totalDurMins}m` },
                                { icon: <Zap className="w-4 h-4 text-gold" />, label: 'XP Pool', val: `${totalXpPool} XP` },
                                { icon: <BarChart3 className="w-4 h-4 text-success" />, label: 'Your Progress', val: `${pct}%` },
                            ].map(({ icon, label, val }) => (
                                <div key={label} className="flex items-center justify-between py-2 border-b border-border">
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <span className="text-primary">{icon}</span> {label}
                                    </div>
                                    <span className="text-sm font-bold text-text-primary">{val}</span>
                                </div>
                            ))}
                            <div className="pt-1">
                                <div className="progress-bar">
                                    <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* AI Notes Panel */}
                        <div className="glass-card-cyan p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <StickyNote className="w-4 h-4 text-cyan" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-cyan">⚡ AI Smart Notes</h3>
                            </div>
                            <p className="text-xs leading-relaxed mb-3 text-text-secondary">
                                AI-generated notes appear here as you complete missions. Start a lesson to unlock notes.
                            </p>
                            {startLec && (
                                <Link
                                    to={`/courses/${courseId}/lectures/${startLec._id}`}
                                    className="text-xs font-bold flex items-center gap-1 hover:underline text-cyan"
                                >
                                    Open Notes for Next Mission <ChevronRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>

                        {/* Doubt Chatbot CTA */}
                        <div className="glass-card p-5 text-center border-cyan/20">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 glow-pulse-anim bg-cyan/10 border border-cyan/40">
                                <MessageSquareText className="w-6 h-6 text-cyan" />
                            </div>
                            <p className="text-sm font-bold text-text-primary mb-1">Ask Doubt Bot</p>
                            <p className="text-xs mb-4 text-text-secondary">AI chatbot answers questions from this course content.</p>
                            {startLec && (
                                <Link
                                    to={`/courses/${courseId}/lectures/${startLec._id}`}
                                    className="btn-esports w-full block text-sm"
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    Open Doubt Bot 🤖
                                </Link>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {showSetupModal && (
                <SetupPlanModal
                    courseId={courseId}
                    isOpen={showSetupModal}
                    onClose={() => setShowSetupModal(false)}
                    onPlanGenerated={() => {
                        window.dispatchEvent(new CustomEvent('refresh-plan', { detail: { courseId } }));
                    }}
                />
            )}
        </div>
    );
};

export default CourseDetail;
