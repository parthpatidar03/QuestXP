import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { shootConfetti } from '../utils/confetti';
import { broadcastProgressUpdate } from '../utils/sync';
import api from '../services/api';
import NavBar from '../components/NavBar';
import StudyPlan from '../components/Dashboard/StudyPlan';
import GenerateRoadmapModal from '../components/Roadmap/GenerateRoadmapModal';
import {
    ArrowLeft, PlayCircle, Loader2, AlertOctagon, Clock,
    BookOpen, Layers, Zap, Lock, CheckCircle2, ChevronRight,
    MessageSquareText, StickyNote, BarChart3, ChevronDown, Trophy, Flag, HelpCircle, Edit2, Share2, Copy, Check, X
} from 'lucide-react';


import { BGPattern } from '../components/ui/bg-pattern';

/* ── helpers ────────────────────────────────────────────────────────── */
const XP_PER_LECTURE = 50;
const fmtDuration = (secs) => {
    if (!secs || secs <= 0) return '—';
    if (secs < 3600) {
        const m = secs / 60;
        return `${m % 1 === 0 ? m : m.toFixed(1)} min`;
    }
    const h = secs / 3600;
    return `${h % 1 === 0 ? h : h.toFixed(1)} hr`;
};



/* ── Lecture Mission Row ────────────────────────────────────────────── */
function MissionRow({ lecture, index, isCompleted, isActive, isLocked, courseId }) {
    const navigate = useNavigate();

    const openLecture = () => {
        if (!isLocked) {
            navigate(`/courses/${courseId}/lectures/${lecture._id}`);
        }
    };

    const openQuiz = (event) => {
        event.stopPropagation();
        if (!isLocked) {
            navigate(`/courses/${courseId}/lectures/${lecture._id}?startQuiz=true`);
        }
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        if (isLocked) return;
        lecture.onToggle?.(lecture._id, isCompleted);
    };

    return (
        <div
            role="button"
            tabIndex={isLocked ? -1 : 0}
            className={`flex items-center gap-3 sm:gap-6 px-3 sm:px-6 py-4 sm:py-5 border-b border-border transition-all group ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface-2/60'}`}
            onClick={openLecture}
            onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && !isLocked) {
                    event.preventDefault();
                    openLecture();
                }
            }}
        >
            {/* Interactive Checkbox */}
            <div className="shrink-0">
                <button
                    onClick={handleToggle}
                    disabled={isLocked}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-40 border-border' :
                        isCompleted 
                            ? 'bg-success border-success text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:scale-110' 
                            : 'border-border bg-surface-3 hover:border-primary/50 hover:scale-110 active:scale-95'
                    }`}
                >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : null}
                </button>
            </div>

            {/* Thumbnail (small) */}
            <div className="relative w-16 h-10 sm:w-24 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-surface-3 border border-border shadow-sm group-hover:border-primary/50 transition-colors hidden xs:block">
                {lecture.thumbnailUrl || lecture.youtubeId
                    ? <img src={lecture.thumbnailUrl || `https://img.youtube.com/vi/${lecture.youtubeId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                    : <PlayCircle className="w-6 h-6 m-auto mt-4 text-text-muted" />}
                {!isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity bg-black/20 group-hover:bg-black/40">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Title + Duration */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className={`text-[13px] sm:text-[14px] font-bold leading-tight line-clamp-2 ${isActive ? 'text-primary' : 'text-text-primary'} group-hover:text-primary transition-colors mb-1`}>
                    <span className="text-[10px] text-text-muted mr-2 font-mono">{String(index + 1).padStart(2, '0')}</span>
                    {lecture.title}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {fmtDuration(lecture.duration)}
                    </span>
                    {lecture.startTime > 0 && (
                        <span className="text-[10px] font-mono text-text-muted/60">
                            {Math.floor(lecture.startTime / 60)}:{String(lecture.startTime % 60).padStart(2, '0')} - {Math.floor((lecture.endTime || 0) / 60)}:{String((lecture.endTime || 0) % 60).padStart(2, '0')}
                        </span>
                    )}
                    {isActive && (
                        <span className="text-[8px] font-black tracking-widest px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary animate-pulse">
                            ACTIVE
                        </span>
                    )}
                    {lecture.aiStatus?.transcription === 'in_progress' && lecture.duration > 900 && (
                        <span className="text-[8px] font-black tracking-widest px-2 py-0.5 rounded border border-cyan/40 bg-cyan/10 text-cyan animate-pulse">
                            AI CHAPTERIZING
                        </span>
                    )}
                </div>
            </div>

            {/* Quiz Fast-Track / Status */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {!isCompleted && !isLocked && (
                    <button
                        type="button"
                        className="p-1.5 sm:p-2 rounded-lg bg-surface-3 hover:bg-primary/20 text-text-muted hover:text-primary transition-all group/quiz flex flex-col items-center gap-1 border border-border"
                        title="Take Quiz to Complete"
                        onClick={openQuiz}
                    >
                        <MessageSquareText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest hidden sm:block">Test</span>
                    </button>
                )}

                {/* XP chip */}
                <div className="xp-chip shrink-0 opacity-80 group-hover:opacity-100 transition-opacity px-2 py-1 sm:px-3 sm:py-1.5">
                    <img src="/favicon.png" alt="" className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain" /> 
                    <span className="text-[10px] sm:text-xs font-black">+{XP_PER_LECTURE}</span>
                </div>
            </div>
        </div>
    );
}


/* ── CourseDetail ───────────────────────────────────────────────────── */import Footer from '../components/ui/Footer';


/* ── Share Modal ─────────────────────────────────────────────────────── */
function ShareModal({ isOpen, onClose, courseTitle, shareUrl }) {
    if (!isOpen) return null;

    const shareText = `*I found this awesome course "${courseTitle}" on QuestXP!* 🚀\n\nWould you like to level up? Check it out here:\n${shareUrl}`;

    const copyMessage = () => {
        navigator.clipboard.writeText(shareText);
        alert('Message copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-bg/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <div className="p-5 border-b border-border bg-surface-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary">
                        <Share2 className="w-5 h-5" />
                        <span className="font-black uppercase tracking-widest text-sm">Share Quest</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="p-4 bg-surface-2 rounded-xl border border-border text-sm text-text-secondary italic leading-relaxed">
                        "{shareText}"
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={copyMessage}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Message
                        </button>
                        <a 
                            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <img src="/whatsapp-icon.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
                            WhatsApp
                        </a>
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                            <span>Direct Link</span>
                            <span className="text-primary">Copied!</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-surface-3 rounded-lg border border-border text-xs font-mono text-text-muted truncate">
                            {shareUrl}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


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
    const [showAddPlaylist, setShowAddPlaylist] = useState(false);
    const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
    const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
    const [addingPlaylist, setAddingPlaylist] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editSectionTitle, setEditSectionTitle] = useState('');
    const [isEditingCourse, setIsEditingCourse] = useState(false);
    const [editCourseTitle, setEditCourseTitle] = useState('');
    const [shareStatus, setShareStatus] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/share/${courseId}`;
        navigator.clipboard.writeText(shareUrl);
        setShareStatus('Copied!');
        setIsShareModalOpen(true);
        setTimeout(() => setShareStatus(''), 2000);
    };

    const toggleSection = (idx) => {
        setCollapsedSections(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const handleRenameCourse = async () => {
        if (!editCourseTitle.trim() || editCourseTitle === course.title) {
            setIsEditingCourse(false);
            return;
        }
        try {
            await api.patch(`/courses/${courseId}`, { title: editCourseTitle });
            setCourse({ ...course, title: editCourseTitle });
            setIsEditingCourse(false);
        } catch (err) {
            console.error(err);
            alert("Failed to rename course");
        }
    };

    const handleRenameSection = async (sectionId) => {
        if (!editSectionTitle.trim()) {
            setEditingSectionId(null);
            return;
        }
        try {
            await api.patch(`/courses/${courseId}/sections/${sectionId}`, { title: editSectionTitle });
            setCourse({
                ...course,
                sections: course.sections.map(s => s._id === sectionId ? { ...s, title: editSectionTitle } : s)
            });
            setEditingSectionId(null);
        } catch (err) {
            console.error(err);
            alert("Failed to rename playlist");
        }
    };

    const handleAddPlaylist = async (e) => {
        e.preventDefault();
        if (!newPlaylistTitle || !newPlaylistUrl) return;
        
        setAddingPlaylist(true);
        try {
            await api.patch(`/courses/${courseId}/sections`, {
                title: newPlaylistTitle,
                playlistUrl: newPlaylistUrl
            });
            setNewPlaylistTitle('');
            setNewPlaylistUrl('');
            setShowAddPlaylist(false);
            // Refresh course data
            const res = await api.get(`/courses/${courseId}`);
            setCourse(res.data.course);
            alert("New playlist added! Videos are being processed in the background.");
        } catch (err) {
            console.error(err);
            alert("Failed to add playlist. Please check the URL.");
        } finally {
            setAddingPlaylist(false);
        }
    };

    const handleToggleCompletion = async (videoId, currentStatus) => {
        if (courseId?.startsWith('demo-')) return;
        
        // Optimistic UI
        const nextStatus = !currentStatus;
        setProgress(prev => {
            const newList = nextStatus 
                ? [...(prev?.completedLectures || []), videoId]
                : (prev?.completedLectures || []).filter(id => id !== videoId);
            return { ...prev, completedLectures: newList };
        });

        try {
            await api.post(`/progress/${courseId}/video/${videoId}/toggle`, {
                isCompleted: nextStatus
            });
            broadcastProgressUpdate();
        } catch (err) {
            console.error("Failed to toggle completion:", err);
            // Revert on error
            setProgress(prev => {
                const revertList = !nextStatus 
                    ? [...(prev?.completedLectures || []), videoId]
                    : (prev?.completedLectures || []).filter(id => id !== videoId);
                return { ...prev, completedLectures: revertList };
            });
        }
    };

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
            if (courseId?.startsWith('demo-')) {
                const local = localStorage.getItem('questxp_demo_course');
                if (local) {
                    const parsed = JSON.parse(local);
                    setCourse(parsed);
                    // Mock progress for demo
                    setProgress({ completedLectures: [], totalMinutes: 0 });
                } else {
                    setError('Demo course not found.');
                }
                return;
            }

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

        // Refetch on focus to keep progress live (with 5s throttle)
        let lastFocusFetch = Date.now();
        const handleFocus = () => {
            if (Date.now() - lastFocusFetch > 5000) {
                fetchAll();
                lastFocusFetch = Date.now();
            }
        };
        window.addEventListener('focus', handleFocus);
        
        // Listen for cross-tab progress updates
        const handleStorageSync = (e) => {
            if (e.key === 'questxp_progress_sync') {
                fetchAll();
            }
        };
        window.addEventListener('storage', handleStorageSync);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleStorageSync);
        };
    }, [courseId]);

    // Poll status if processing
    useEffect(() => {
        if (!course || course.status === 'ready' || course.status === 'error' || courseId?.startsWith('demo-')) return;
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
        <div className="min-h-screen bg-bg">
            <NavBar />
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
                <div className="h-4 bg-surface-2 rounded w-28 mb-6" />
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="rounded-2xl bg-surface border border-border h-52 mb-6 p-7">
                            <div className="h-4 bg-surface-2 rounded w-24 mb-4" />
                            <div className="h-8 bg-surface-2 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-surface-2 rounded w-40 mb-6" />
                            <div className="h-10 bg-surface-2 rounded-lg w-36" />
                        </div>
                        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                            <div className="px-8 py-6 border-b border-border">
                                <div className="h-5 bg-surface-2 rounded w-32 mb-2" />
                                <div className="h-3 bg-surface-2 rounded w-48" />
                            </div>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center gap-6 px-6 py-5 border-b border-border">
                                    <div className="w-10 h-10 rounded-full bg-surface-2" />
                                    <div className="w-24 h-14 rounded-lg bg-surface-2" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-surface-2 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-surface-2 rounded w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
                        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
                            <div className="h-4 bg-surface-2 rounded w-24" />
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex justify-between py-2 border-b border-border">
                                    <div className="h-3 bg-surface-2 rounded w-24" />
                                    <div className="h-3 bg-surface-2 rounded w-12" />
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
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
                    <h2 className="text-3xl font-black mb-3 text-text-primary">Synthesizing Quest</h2>
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
                <h2 className="text-2xl font-black mb-3 text-text-primary">Quest Failed</h2>
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
                <Link to="/dashboard" className="inline-flex items-center gap-3 px-5 py-2.5 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl transition-all group mb-8 w-fit">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                        <ArrowLeft className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-text-primary">Back to Library</span>
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
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="badge-epic text-[10px] py-1 px-3">EPIC QUEST</span>
                                    <span className="text-sm font-bold text-text-secondary">{allLectures.length} Missions · {totalDurMins} Minutes</span>
                                </div>
                                <h1 className="text-2xl sm:text-5xl font-black text-text-primary mb-5 leading-[1.1] max-w-xl">
                                    {course.title}
                                </h1>
                                <div className="flex items-center gap-3 sm:gap-4 flex-wrap mb-6">
                                    <div className="xp-chip text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-1.5 shrink-0">
                                        <img src="/favicon.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" /> 
                                        {totalXpPool} XP Available
                                    </div>
                                    <div className="text-[10px] sm:text-sm font-black text-success uppercase tracking-wider bg-success/10 px-3 py-1 rounded-full border border-success/20">
                                        🚀 {pct}% Complete
                                    </div>
                                </div>
                                {startLec && (
                                    <div className="flex items-center gap-2 sm:gap-3 mt-4 flex-wrap">
                                        <Link
                                            to={`/courses/${courseId}/lectures/${startLec._id}`}
                                            className="btn-esports inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm flex-1 sm:flex-none"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            <span className="whitespace-nowrap">{completedCount > 0 ? 'Resume' : 'Start Quest'}</span>
                                        </Link>
                                        <Link 
                                            to={`/roadmap?courseId=${courseId}`} 
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 bg-surface-2 hover:bg-surface-3 transition-colors rounded-lg text-[10px] sm:text-sm font-bold text-text-primary border border-border flex-1 sm:flex-none"
                                        >
                                            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                            <span className="whitespace-nowrap">Roadmap</span>
                                        </Link>
                                        <ShareModal 
                                            isOpen={isShareModalOpen} 
                                            onClose={() => setIsShareModalOpen(false)} 
                                            courseTitle={course?.title}
                                            shareUrl={`${window.location.origin}/share/${courseId}`}
                                        />
                                        <button 
                                            onClick={handleShare}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 bg-surface-2 hover:bg-surface-3 transition-colors rounded-lg text-[10px] sm:text-sm font-bold text-text-primary border border-border flex-1 sm:flex-none"
                                        >
                                            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                            <span className="whitespace-nowrap">{shareStatus || 'Share'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4-Week Study Plan */}
                        <div className="mb-6">
                            {!courseId?.startsWith('demo-') ? (
                                <StudyPlan courseId={courseId} onOpenSetup={() => setShowSetupModal(true)} />
                            ) : (
                                <div className="glass-card p-6 border-dashed opacity-75">
                                    <p className="text-sm text-text-muted text-center italic">Study Plans are available for registered users.</p>
                                </div>
                            )}
                        </div>

                        {/* Mission List */}
                        <div className="glass-card overflow-hidden" style={{ padding: 0 }}>
                            <div className="px-8 py-6 border-b border-border bg-surface/30">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                    <div className="flex flex-col min-w-0">
                                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-text-primary leading-none flex items-center gap-2">
                                            🗺️ Quest Journey
                                        </h2>
                                        <p className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] mt-2 opacity-80">
                                            Path to Mastery
                                        </p>
                                    </div>
                                    <div className="flex min-h-[68px] w-[9.5rem] shrink-0 flex-col items-start justify-center gap-1 py-2 pr-0 sm:w-[12.5rem] sm:items-end sm:self-stretch sm:gap-2 sm:pl-8 sm:pr-3 sm:text-right">
                                        <div
                                            className="text-3xl sm:text-4xl md:text-[2.75rem] font-black text-primary leading-[0.92] tabular-nums"
                                        >
                                            {pct}%
                                        </div>
                                        <div className="mt-1 text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.18em] leading-none opacity-70 whitespace-nowrap">
                                            COMPLETED
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Elite Journey Progress Bar */}
                                <div className="relative pt-2 pb-12 sm:pb-14">
                                    {/* Track */}
                                    <div className="h-5 w-full bg-surface-2 rounded-full border border-border/50 relative overflow-visible shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                                        {/* Progress Fill */}
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className="absolute top-0 left-0 h-full bg-success rounded-full shadow-[0_0_25px_var(--color-success)]"
                                        >
                                            {/* Journey Thumb (The Runner) */}
                                            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-[3px] border-success shadow-[0_0_12px_var(--color-success)] z-10 flex items-center justify-center overflow-hidden">
                                                <span className="text-xl transform scale-x-[-1] translate-x-[1px]">🏃</span>
                                            </div>
                                        </motion.div>
                                        
                                        {/* Goal Icon - Aligned with the track */}
                                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col items-center">
                                            <div className="absolute -top-12 sm:-top-14 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] whitespace-nowrap opacity-70">
                                                Victory Goal
                                            </div>
                                            <span className={`text-2xl ${pct === 100 ? 'animate-bounce' : 'opacity-90'}`}>🚩</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Done vs Remaining Stats */}
                                <div className="flex flex-col sm:flex-row items-center justify-between mt-2 px-4 py-4 sm:py-3 border-t border-border/40 bg-surface-2/20 rounded-2xl gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Completed</span>
                                            <span className="text-sm font-bold text-text-primary">{completedCount} Missions</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">To Go</span>
                                            <span className="text-sm font-bold text-text-primary">{allLectures.length - completedCount} Missions</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center border border-border">
                                            <Flag className="w-5 h-5 text-text-muted" />
                                        </div>
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
                                                                lecture={{ ...lec, onToggle: handleToggleCompletion }}
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
                                { icon: <Clock className="w-4 h-4" />, label: 'Duration', val: `${totalDurMins} Minutes` },
                                { icon: <img src="/favicon.png" alt="" className="w-4 h-4 object-contain" />, label: 'XP Pool', val: `${totalXpPool} XP` },
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
                <GenerateRoadmapModal
                    isOpen={showSetupModal}
                    courseId={courseId}
                    onClose={() => setShowSetupModal(false)}
                    onGenerated={() => {
                        window.location.reload();
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
            icon: <img src="/favicon.png" alt="" className="w-8 h-8 object-contain" />,
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
                            <h2 className="text-3xl font-black mb-4 uppercase tracking-tight text-[var(--color-primary)]">
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
