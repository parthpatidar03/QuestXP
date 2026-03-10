import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import NavBar from '../components/NavBar';
import {
    ArrowLeft, PlayCircle, Loader2, AlertOctagon, Clock,
    BookOpen, Layers, Zap, Lock, CheckCircle2, ChevronRight,
    MessageSquareText, StickyNote, BarChart3
} from 'lucide-react';

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
    const stateColor = isCompleted ? '#10B981' : isActive ? '#00b4ff' : '#2a2f52';
    const stateLabel = isCompleted ? 'DONE' : isActive ? 'ACTIVE' : 'LOCKED';

    return (
        <Link
            to={isLocked ? '#' : `/courses/${courseId}/lectures/${lecture._id}`}
            className={`flex items-center gap-4 px-5 py-4 border-b border-[#1a1e35] transition-all group ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-[#12152a]/60'}`}
            onClick={e => isLocked && e.preventDefault()}
        >
            {/* Hex mission number */}
            <div
                className="hex-clip w-9 h-9 flex items-center justify-center text-xs font-black shrink-0"
                style={{ background: isCompleted ? '#10B981' : isActive ? '#00b4ff' : '#1a1e35', color: isLocked ? '#4a5480' : '#fff' }}
            >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-4 h-4" /> : index + 1}
            </div>

            {/* Thumbnail (small) */}
            <div className="relative w-16 h-10 rounded overflow-hidden shrink-0 bg-[#12152a]">
                {lecture.thumbnailUrl
                    ? <img src={lecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    : <PlayCircle className="w-5 h-5 m-auto mt-2" style={{ color: '#2a2f52' }} />}
                {!isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <PlayCircle className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>

            {/* Title + Duration */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug line-clamp-2 ${isActive ? 'text-[#00b4ff]' : 'text-white'} group-hover:text-[#00b4ff] transition-colors`}>
                    {lecture.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#4a5480' }}>
                        <Clock className="w-3 h-3" /> {fmtDuration(lecture.duration)}
                    </span>
                    {isActive && (
                        <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded border animate-pulse" style={{ color: '#00b4ff', borderColor: '#00b4ff40', background: 'rgba(0,180,255,0.08)' }}>
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
        <div className="min-h-screen" style={{ background: '#0d0f1a' }}>
            <NavBar />
            <div className="flex flex-col items-center justify-center py-32">
                <AlertOctagon className="w-14 h-14 mb-4" style={{ color: '#EF4444' }} />
                <p className="text-white font-bold text-lg mb-6">{error}</p>
                <Link to="/dashboard" className="btn-primary">Return to Dashboard</Link>
            </div>
        </div>
    );

    if (!course) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f1a' }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#00b4ff' }} />
        </div>
    );

    if (course.status === 'processing') {
        const processed = statusData?.processedCount || 0;
        const total = statusData?.totalCount || '…';
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: '#0d0f1a' }}>
                <div className="glass-card max-w-md w-full text-center p-10">
                    <div className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-[#1a1e35] rounded-full" />
                        <div className="absolute inset-0 border-4 border-[#00b4ff] rounded-full border-t-transparent animate-spin" />
                        <BookOpen className="w-8 h-8 text-[#00b4ff] absolute" />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Synthesizing Quest</h2>
                    <p className="text-sm mb-8" style={{ color: '#8b9cc8' }}>Analyzing playlist, extracting metadata, building your mission list…</p>
                    <div className="bg-[#1a1e35] rounded-xl p-4 border border-[#2a2f52]">
                        <div className="flex justify-between items-center mb-2 text-xs">
                            <span className="font-semibold text-white">Processing Missions</span>
                            <span style={{ color: '#4a5480' }}>{processed} / {total}</span>
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
        <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: '#0d0f1a' }}>
            <div className="glass-card max-w-md w-full text-center p-10" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                <AlertOctagon className="w-14 h-14 mx-auto mb-6" style={{ color: '#EF4444' }} />
                <h2 className="text-2xl font-black mb-3 text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Quest Failed</h2>
                <p className="text-sm mb-8" style={{ color: '#8b9cc8' }}>Could not process playlist. Ensure URLs are public YouTube playlists.</p>
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
        <div className="min-h-screen" style={{ background: '#0d0f1a' }}>
            <NavBar />

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

                {/* Back link */}
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-6 group transition-colors" style={{ color: '#8b9cc8' }}>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" style={{ color: '#00b4ff' }} />
                    Back to Library
                </Link>

                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── Left: Hero + Mission List ── */}
                    <div className="flex-1 min-w-0">

                        {/* Hero Banner */}
                        <div
                            className="relative rounded-2xl overflow-hidden mb-6"
                            style={{
                                background: heroThumb
                                    ? `linear-gradient(to right, #0d0f1a 40%, transparent 100%),  url(${heroThumb}) right center / cover no-repeat`
                                    : 'linear-gradient(135deg, #12152a, #1a1e35)',
                                minHeight: 200,
                                border: '1px solid rgba(0,180,255,0.2)'
                            }}
                        >
                            <div className="relative z-10 p-7">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="badge-epic">EPIC</span>
                                    <span className="text-xs" style={{ color: '#8b9cc8' }}>{allLectures.length} Missions · {totalDurMins}m</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight max-w-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                                    {course.title}
                                </h1>
                                <div className="flex items-center gap-3 flex-wrap mb-5">
                                    <div className="xp-chip text-sm px-3 py-1"><Zap className="w-4 h-4" /> {totalXpPool} XP Available</div>
                                    <div className="text-xs font-semibold" style={{ color: '#10B981' }}>{pct}% Complete</div>
                                </div>
                                {startLec && (
                                    <Link
                                        to={`/courses/${courseId}/lectures/${startLec._id}`}
                                        className="btn-esports inline-flex items-center gap-2"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                        {completedCount > 0 ? 'Resume Mission' : 'Start Quest'}
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Mission List */}
                        <div className="glass-card overflow-hidden" style={{ padding: 0 }}>
                            <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: '#1a1e35' }}>
                                <Layers className="w-4 h-4 text-[#00b4ff]" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Mission List</h2>
                                <div className="ml-auto text-xs" style={{ color: '#4a5480' }}>{completedCount}/{allLectures.length} complete</div>
                            </div>

                            {course.sections.map((section, sIdx) => (
                                <React.Fragment key={sIdx}>
                                    {course.sections.length > 1 && (
                                        <div className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest" style={{ background: '#0d0f1a', color: '#4a5480' }}>
                                            Section {sIdx + 1}: {section.title}
                                        </div>
                                    )}
                                    {section.lectures.map((lec, lIdx) => {
                                        const globalIdx = course.sections.slice(0, sIdx).reduce((a, s) => a + s.lectures.length, 0) + lIdx;
                                        const isDone = completedSet.has(lec._id);
                                        const isActive = !isDone && startLec?._id === lec._id;
                                        // Unlock if: done OR is active (next to take)
                                        const isLocked = !isDone && !isActive && false; // For now, all unlocked

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
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* ── Right Sidebar ── */}
                    <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">

                        {/* Course Stats */}
                        <div className="glass-card p-5 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#8b9cc8' }}>Quest Stats</h3>
                            {[
                                { icon: <Layers className="w-4 h-4" />, label: 'Total Missions', val: allLectures.length },
                                { icon: <Clock className="w-4 h-4" />, label: 'Duration', val: `${totalDurMins}m` },
                                { icon: <Zap className="w-4 h-4 text-[#f5a524]" />, label: 'XP Pool', val: `${totalXpPool} XP` },
                                { icon: <BarChart3 className="w-4 h-4 text-[#10B981]" />, label: 'Your Progress', val: `${pct}%` },
                            ].map(({ icon, label, val }) => (
                                <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#1a1e35' }}>
                                    <div className="flex items-center gap-2 text-xs" style={{ color: '#8b9cc8' }}>
                                        <span style={{ color: '#00b4ff' }}>{icon}</span> {label}
                                    </div>
                                    <span className="text-sm font-bold text-white">{val}</span>
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
                                <StickyNote className="w-4 h-4 text-[#00e5ff]" />
                                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00e5ff' }}>⚡ AI Smart Notes</h3>
                            </div>
                            <p className="text-xs leading-relaxed mb-3" style={{ color: '#8b9cc8' }}>
                                AI-generated notes appear here as you complete missions. Start a lesson to unlock notes.
                            </p>
                            {startLec && (
                                <Link
                                    to={`/courses/${courseId}/lectures/${startLec._id}`}
                                    className="text-xs font-bold flex items-center gap-1 hover:underline"
                                    style={{ color: '#00e5ff' }}
                                >
                                    Open Notes for Next Mission <ChevronRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>

                        {/* Doubt Chatbot CTA */}
                        <div className="glass-card p-5 text-center" style={{ borderColor: 'rgba(0,229,255,0.2)' }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 glow-pulse-anim" style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.4)' }}>
                                <MessageSquareText className="w-6 h-6 text-[#00e5ff]" />
                            </div>
                            <p className="text-sm font-bold text-white mb-1">Ask Doubt Bot</p>
                            <p className="text-xs mb-4" style={{ color: '#8b9cc8' }}>AI chatbot answers questions from this course content.</p>
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
        </div>
    );
};

export default CourseDetail;
