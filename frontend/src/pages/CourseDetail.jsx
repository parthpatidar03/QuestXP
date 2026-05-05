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
    MessageSquareText, StickyNote, BarChart3, ChevronDown, Trophy, Flag, HelpCircle
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
            className={`flex items-center gap-6 px-6 py-5 border-b border-border transition-all group ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface-2/60'}`}
            onClick={e => isLocked && e.preventDefault()}
        >
            {/* Hex mission number */}
            <div
                className="hex-clip w-10 h-10 flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm transition-transform group-hover:scale-105"
                style={{ 
                    background: isCompleted ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-surface-3)', 
                    color: isLocked 
                        ? 'var(--color-text-muted)' 
                        : (isCompleted || isActive) 
                            ? '#fff' 
                            : 'var(--color-text-secondary)',
                    border: isActive ? '2px solid rgba(255,255,255,0.2)' : 'none'
                }}
            >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : index + 1}
            </div>

            {/* Thumbnail (small) */}
            <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-3 border border-border shadow-sm group-hover:border-primary/50 transition-colors">
                {lecture.thumbnailUrl || lecture.youtubeId
                    ? <img src={lecture.thumbnailUrl || `https://img.youtube.com/vi/${lecture.youtubeId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                    : <PlayCircle className="w-6 h-6 m-auto mt-4 text-text-muted" />}
                {!isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <PlayCircle className="w-5 h-5 text-white fill-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Title + Duration */}
            <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-bold leading-tight line-clamp-2 ${isActive ? 'text-primary' : 'text-text-primary'} group-hover:text-primary transition-colors`}>
                    {lecture.title}
                </p>
                <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                        <Clock className="w-3.5 h-3.5" /> {fmtDuration(lecture.duration)}
                    </span>
                    {isActive && (
                        <span className="text-[9px] font-black tracking-[0.15em] px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary animate-pulse">
                            ACTIVE
                        </span>
                    )}
                </div>
            </div>

            {/* Quiz Fast-Track / Status */}
            <div className="flex items-center gap-3 shrink-0 ml-auto">
                {!isCompleted && !isLocked && (
                    <Link
                        to={`/courses/${courseId}/lectures/${lecture._id}?startQuiz=true`}
                        className="p-2 rounded-lg bg-surface-3 hover:bg-primary/20 text-text-muted hover:text-primary transition-all group/quiz flex flex-col items-center gap-1 border border-border"
                        title="Take Quiz to Complete"
                        onClick={e => e.stopPropagation()}
                    >
                        <MessageSquareText className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest hidden sm:block">Test</span>
                    </Link>
                )}

                {/* XP chip */}
                <div className="xp-chip shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Zap className="w-3.5 h-3.5 fill-gold/20" /> +{XP_PER_LECTURE}
                </div>
            </div>
        </Link>
    );
}


/* ── CourseDetail ───────────────────────────────────────────────────── */import Footer from '../components/ui/Footer';


const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [progress, setProgress] = useState(null);
    const [statusData, setStatusData] = useState(null);
    const [error, setError] = useState(null);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});

    useEffect(() => {
        const hasOnboarded = localStorage.getItem('questxp_onboarded');
        if (!hasOnboarded) {
            setShowOnboarding(true);
        }
    }, []);

    const markOnboarded = () => {
        localStorage.setItem('questxp_onboarded', 'true');
        setShowOnboarding(false);
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
                            <div className="px-8 py-6 border-b border-border bg-surface/30">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex flex-col">
                                        <h2 className="text-base font-black uppercase tracking-tight text-text-primary leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Quest Journey</h2>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1.5 opacity-80">Walking towards your goal</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-primary leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{pct}%</div>
                                        <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1.5">COMPLETED</div>
                                    </div>
                                </div>
                                
                                {/* Elite Journey Progress Bar */}
                                <div className="relative pt-4 pb-8">
                                    {/* Track */}
                                    <div className="h-3 w-full bg-surface-2 rounded-full border border-border/50 relative overflow-visible shadow-inner">
                                        {/* Progress Fill */}
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1.2, ease: "circOut" }}
                                            className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_15px_oklch(0.47_0.095_155_/_0.3)]"
                                        >
                                            {/* Journey Thumb (The Runner) */}
                                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-[3px] border-primary shadow-[0_0_12px_var(--color-primary)] z-10 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            </div>
                                        </motion.div>
                                        
                                        {/* Goal Icon */}
                                        <div className="absolute -right-1 -top-10 flex flex-col items-center">
                                            <Trophy className={`w-6 h-6 ${pct === 100 ? 'text-gold animate-bounce' : 'text-text-muted opacity-30'}`} />
                                            <div className="text-[9px] font-black text-text-muted mt-1 uppercase tracking-tighter">FINISH</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Done vs Remaining Stats */}
                                <div className="flex items-center justify-between mt-4 px-8 py-5 border-t border-border/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Done: <span className="text-text-primary">{completedCount} Missions</span></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Remaining: <span className="text-text-primary">{allLectures.length - completedCount} Missions</span></span>
                                        <div className="w-2.5 h-2.5 rounded-full bg-surface-3" />
                                    </div>
                                </div>
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
            {/* Onboarding Walkthrough */}
            <AnimatePresence>
                {showOnboarding && (
                    <OnboardingModal onClose={markOnboarded} />
                )}
            </AnimatePresence>
            <Footer />
        </div>
    );
};

const OnboardingModal = ({ onClose }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Welcome to QuestXP",
            description: "You're not just watching videos—you're on a Quest. This app is designed to help you MASTER skills through active learning.",
            icon: <Trophy className="w-8 h-8 text-gold" />,
            color: "var(--color-primary)"
        },
        {
            title: "The Mastery System",
            description: "Passive watching is over. To complete a mission, you MUST pass the AI Knowledge Quiz at the end of each video.",
            icon: <Zap className="w-8 h-8 text-primary" />,
            color: "var(--color-primary)"
        },
        {
            title: "Proof of Knowledge",
            description: "Already an expert? Use the 'Test' button to skip the video and jump straight to the quiz. No wasted time.",
            icon: <HelpCircle className="w-8 h-8 text-secondary" />,
            color: "var(--color-secondary)"
        },
        {
            title: "Earn XP & Rewards",
            description: "Pass quizzes to earn +50 XP and unlock new levels. Your streak and progress are tracked in real-time.",
            icon: <CheckCircle2 className="w-8 h-8 text-success" />,
            color: "#10B981"
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl relative"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-surface-3)]">
                    <motion.div 
                        className="h-full bg-[var(--color-primary)]" 
                        initial={{ width: 0 }}
                        animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-8 sm:p-12 text-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface-3)] flex items-center justify-center mb-8 border border-[var(--color-border)] shadow-xl">
                                {steps[step].icon}
                            </div>
                            <h2 className="text-3xl font-black mb-4 uppercase tracking-tight text-[var(--color-primary)]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {steps[step].title}
                            </h2>
                            <p className="text-[var(--color-text-secondary)] text-base leading-relaxed mb-10 max-w-sm font-medium">
                                {steps[step].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex items-center justify-between gap-4 mt-4">
                        <button 
                            onClick={onClose}
                            className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            Skip Tour
                        </button>
                        
                        <div className="flex gap-2">
                            {step > 0 && (
                                <button 
                                    onClick={() => setStep(step - 1)}
                                    className="p-4 rounded-2xl bg-[var(--color-surface-3)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-primary)]"
                                >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>
                            )}
                            <button 
                                onClick={() => step < steps.length - 1 ? setStep(step + 1) : onClose()}
                                className="px-8 py-4 rounded-2xl bg-[var(--color-primary)] text-black font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {step < steps.length - 1 ? (
                                    <>Next <ChevronRight className="w-4 h-4" /></>
                                ) : "Begin My Quest 🏆"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dot Indicator */}
                <div className="flex justify-center gap-2 pb-8">
                    {steps.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[var(--color-primary)]' : 'w-1.5 bg-[var(--color-surface-3)]'}`}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default CourseDetail;
