import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import VideoPlayer from '../components/Player/VideoPlayer';
import TimelineSidebar from '../components/Player/TimelineSidebar';
import NotesTab from '../components/Lecture/NotesTab';
import QuizTab from '../components/Lecture/QuizTab';
import DoubtChatbot from '../components/Lecture/DoubtChatbot';
import useGamificationStore from '../store/useGamificationStore';
import { ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { BGPattern } from '../components/ui/bg-pattern';
import { useLectureStatus } from '../hooks/useLectureStatus';
import { shootConfetti } from '../utils/confetti';
import { broadcastProgressUpdate } from '../utils/sync';

const TABS = [
    { key: 'timeline', label: 'Timeline' },
    { key: 'notes',    label: 'Summary' },
    { key: 'quiz',     label: 'Quiz' },
];

const Player = () => {
    const { courseId, lectureId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addXPToast, applyAward } = useGamificationStore();
    const shouldStartQuiz = useMemo(() => new URLSearchParams(location.search).get('startQuiz') === 'true', [location.search]);

    const [course, setCourse] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCompletionCard, setShowCompletionCard] = useState(false);
    const [activeTab, setActiveTab] = useState(() => shouldStartQuiz ? 'quiz' : 'timeline');
    const [quizAutoStart, setQuizAutoStart] = useState(false);
    const [lectureAiStatus, setLectureAiStatus] = useState(null);
    const [xpEarned, setXpEarned] = useState(null); // golden XP toast value
    const [seekTo, setSeekTo] = useState(null);
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));
    const [isDark, setIsDark] = useState(() => (typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : true));
    const positionTimerRef = useRef(null);
    const autoCompleteInFlightRef = useRef(false);
    const currentTimeRef = useRef(0);
    const lastSavedPositionRef = useRef(0);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const fetchCourse = async () => {
            if (courseId?.startsWith('demo-')) {
                const local = localStorage.getItem('questxp_demo_course');
                if (local) {
                    const parsed = JSON.parse(local);
                    setCourse(parsed);
                } else {
                    setError('Demo course not found.');
                }
                setLoading(false);
                return;
            }

            try {
                const [cRes, pRes] = await Promise.allSettled([
                    api.get(`/courses/${courseId}`),
                    api.get(`/progress/${courseId}`)
                ]);
                if (cRes.status === 'fulfilled') setCourse(cRes.value.data.course);
                if (pRes.status === 'fulfilled' && pRes.value.data.progress)
                    setProgress(pRes.value.data.progress);
            } catch (err) {
                setError('Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
        setShowCompletionCard(false);
        setQuizAutoStart(false);
        setLectureAiStatus(null);
        setXpEarned(null);
        setSeekTo(null);
        currentTimeRef.current = 0;
        lastSavedPositionRef.current = 0;

        // Refetch on focus (5s throttle)
        let lastFocusFetch = Date.now();
        const handleFocus = () => {
            if (Date.now() - lastFocusFetch > 5000) {
                fetchCourse();
                lastFocusFetch = Date.now();
            }
        };
        window.addEventListener('focus', handleFocus);

        // Listen for same-tab and cross-tab progress updates
        const handleProgressSync = () => fetchCourse();
        window.addEventListener('questxp_progress_updated', handleProgressSync);
        const handleStorageSync = (e) => {
            if (e.key === 'questxp_progress_sync') {
                fetchCourse();
            }
        };
        window.addEventListener('storage', handleStorageSync);

        return () => { 
            if (positionTimerRef.current) clearInterval(positionTimerRef.current); 
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('questxp_progress_updated', handleProgressSync);
            window.removeEventListener('storage', handleStorageSync);
        };
    }, [courseId, lectureId]);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const observer = new MutationObserver(() => {
            setIsDark(root.classList.contains('dark'));
        });
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Auto-save position every 30s
    useEffect(() => {
        positionTimerRef.current = setInterval(() => {
            const latestTime = currentTimeRef.current;
            if (latestTime > 5 && !courseId?.startsWith('demo-')) {
                const position = Math.floor(latestTime);
                const watchedSeconds = Math.max(0, position - lastSavedPositionRef.current);
                if (watchedSeconds <= 0) return;
                lastSavedPositionRef.current = position;

                api.patch(`/progress/${courseId}/lectures/${lectureId}/position`, {
                    position,
                    watchedSeconds
                }).catch(() => {});
            }
        }, 30000);
        return () => clearInterval(positionTimerRef.current);
    }, [courseId, lectureId]);

    const allLectures = useMemo(() => {
        if (!course) return [];
        return course.sections.flatMap(s => s.lectures);
    }, [course]);

    const currentSectionIndex = useMemo(() => {
        if (!course) return -1;
        return course.sections.findIndex(s => s.lectures.some(l => l._id === lectureId));
    }, [course, lectureId]);

    const currentLectureIndex = useMemo(() => allLectures.findIndex(l => l._id === lectureId), [allLectures, lectureId]);
    const currentLecture = allLectures[currentLectureIndex];
    const prevLecture = currentLectureIndex > 0 ? allLectures[currentLectureIndex - 1] : null;
    const nextLecture = currentLectureIndex < allLectures.length - 1 ? allLectures[currentLectureIndex + 1] : null;
    const currentAiStatus = lectureAiStatus || currentLecture?.aiStatus || {};

    const handleTopicClick = (t) => setSeekTo({ time: t, version: Date.now() });

    const handleTimeUpdate = (time) => {
        currentTimeRef.current = time;
    };
    
    const handleToggleCompletion = async (videoId, currentStatus) => {
        if (courseId?.startsWith('demo-')) return;
        
        // Optimistic UI
        const nextStatus = !currentStatus;
        setProgress(prev => {
            const newList = nextStatus 
                ? [...new Set([...(prev?.completedLectures || []), videoId])]
                : (prev?.completedLectures || []).filter(id => id !== videoId);
            return { ...prev, completedLectures: newList };
        });

        try {
            const { data } = await api.post(`/progress/${courseId}/video/${videoId}/toggle`, {
                isCompleted: nextStatus
            });
            setProgress(prev => ({
                ...(prev || {}),
                completedLectures: prev?.completedLectures || [],
                completionPct: data?.completionPct ?? prev?.completionPct
            }));
            broadcastProgressUpdate();
        } catch (err) {
            console.error("Failed to toggle completion:", err);
            // Revert on error
            setProgress(prev => {
                const revertList = !nextStatus 
                    ? [...new Set([...(prev?.completedLectures || []), videoId])]
                    : (prev?.completedLectures || []).filter(id => id !== videoId);
                return { ...prev, completedLectures: revertList };
            });
        }
    };

    const markLectureComplete = async (videoId) => {
        if (courseId?.startsWith('demo-') || !videoId || autoCompleteInFlightRef.current) return;

        const alreadyCompleted = progress?.completedLectures?.some(id => id?.toString() === videoId?.toString());
        if (alreadyCompleted) return;

        autoCompleteInFlightRef.current = true;
        setProgress(prev => ({
            ...(prev || {}),
            completedLectures: [...new Set([...(prev?.completedLectures || []), videoId])]
        }));

        try {
            const { data } = await api.post(`/progress/${courseId}/video/${videoId}/toggle`, {
                isCompleted: true
            });
            const xp = data?.xpAwarded || 0;

            setProgress(prev => ({
                ...(prev || {}),
                completedLectures: [...new Set([...(prev?.completedLectures || []), videoId])],
                completionPct: data?.completionPct ?? prev?.completionPct
            }));

            if (xp > 0) {
                setXpEarned(xp);
                setShowCompletionCard(true);
                addXPToast(xp, 'Video Complete');
                shootConfetti();
            } else {
                addXPToast(0, 'Video Complete');
            }

            broadcastProgressUpdate();
        } catch (err) {
            console.error("Failed to auto-complete video:", err);
            setProgress(prev => ({
                ...(prev || {}),
                completedLectures: (prev?.completedLectures || []).filter(id => id?.toString() !== videoId?.toString())
            }));
        } finally {
            autoCompleteInFlightRef.current = false;
        }
    };

    useEffect(() => {
        if (shouldStartQuiz) {
            setActiveTab('quiz');
        }
    }, [lectureId, shouldStartQuiz]);

    useEffect(() => {
        if (!loading && shouldStartQuiz && sidebarRef.current) {
            sidebarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [loading, shouldStartQuiz]);

    const aiStatus = useLectureStatus(currentLecture?._id, 
        (['pending', 'in_progress'].includes(currentAiStatus.quiz) && activeTab === 'quiz') ||
        (['pending', 'in_progress'].includes(currentAiStatus.notes) && activeTab === 'notes')
    );

    useEffect(() => {
        if (aiStatus) {
            setLectureAiStatus(aiStatus);
        }
    }, [aiStatus]);

    useEffect(() => {
        const handleMissionComplete = (e) => {
            const { xpEarned, lectureId: completedLecId } = e.detail;
            setXpEarned(xpEarned);
            setShowCompletionCard(true);
            if (xpEarned > 0) {
                addXPToast(xpEarned, 'Mission Complete');
                shootConfetti();
            }

            // Update local progress state so Timeline tick appears
            if (completedLecId) {
                setProgress(prev => ({
                    ...prev,
                    completedLectures: [...new Set([...(prev?.completedLectures || []), completedLecId])]
                }));
            }
            broadcastProgressUpdate();

            // Refresh gamification profile so NavBar XP updates
            import('../services/gamificationApi').then(({ getGamificationProfile }) => {
                getGamificationProfile().then(profile => {
                    import('../store/useGamificationStore').then(m => {
                        m.default.getState().setProfile(profile);
                    });
                });
            }).catch(() => {});
        };

        window.addEventListener('mission-completed', handleMissionComplete);
        const handleSwitchTab = (e) => setActiveTab(e.detail);
        window.addEventListener('switch-tab', handleSwitchTab);
        return () => {
            window.removeEventListener('mission-completed', handleMissionComplete);
            window.removeEventListener('switch-tab', handleSwitchTab);
        };
    }, []);

    const handleVideoEnd = () => {
        setQuizAutoStart(true);
        setActiveTab('quiz');
        markLectureComplete(currentLecture?._id);
    };

    const handleNextLecture = () => nextLecture
        ? navigate(`/courses/${courseId}/lectures/${nextLecture._id}`)
        : navigate(`/courses/${courseId}`);

const PLAYER_THEME = {
    pageBg: 'var(--color-bg)',
    panelBg: 'var(--color-surface)',
    panelAlt: 'var(--color-surface-2)',
    border: 'var(--color-border)',
    muted: 'var(--color-text-muted)',
    text: 'var(--color-text-primary)',
    secondaryText: 'var(--color-text-secondary)',
    patternFill: 'var(--color-primary)',
    progressTrack: 'var(--color-surface-2)',
    shadow: '0 8px 32px rgba(0, 255, 128, 0.1)',
    completionBg: 'rgba(18, 21, 42, 0.95)',
    completionBorder: '1px solid var(--color-primary)',
    completionBtnBg: 'var(--color-surface-2)',
    completionBtnBorder: 'var(--color-border)',
    completionBtnText: 'var(--color-text-secondary)',
    primary: 'var(--color-primary)', // #00FF80 style
};


    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: PLAYER_THEME.pageBg }}>
            <div className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: PLAYER_THEME.muted }}>Loading Mission</p>
        </div>
    );

    if (error || !currentLecture) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: PLAYER_THEME.pageBg }}>
            <p className="text-lg font-semibold mb-4" style={{ color: '#ef4444' }}>{error || 'Lecture not found'}</p>
            <Link to="/dashboard" className="btn-primary">Return to Dashboard</Link>
        </div>
    );

    return (
        <div
            className="min-h-screen flex flex-col relative"
            style={{ background: PLAYER_THEME.pageBg }}
        >
            <BGPattern variant="grid" mask="fade-edges" fill={PLAYER_THEME.patternFill} className="opacity-10 z-0" />

            {/* Top progress bar */}
            <div className="fixed top-0 left-0 w-full h-[2px] z-50" style={{ background: PLAYER_THEME.progressTrack }}>
                <div
                    className="h-full transition-all duration-500 shadow-[0_0_8px_var(--color-primary)]"
                    style={{ width: `${((currentLectureIndex + 1) / allLectures.length) * 100}%`, background: 'var(--color-primary)' }}
                />
            </div>

            {/* Header - Ultra Thinner */}
            <header className="shrink-0 px-3 sm:px-6 py-1 sm:py-1.5 flex flex-col gap-1 border-b" style={{ borderColor: PLAYER_THEME.border, background: PLAYER_THEME.panelBg }}>
                <div className="flex items-center justify-between">
                    <Link
                        to={`/courses/${courseId}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-2/50 hover:bg-surface-3 border border-border/50 rounded-lg transition-all group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-primary group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover:text-text-primary transition-colors">Course Overview</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                            MISSION {currentLectureIndex + 1} OF {allLectures.length}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 min-w-0">
                    <h1 className="text-sm sm:text-base font-black tracking-tight line-clamp-1" style={{ color: PLAYER_THEME.text }}>
                        {currentLecture.title}
                    </h1>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                        {prevLecture && (
                            <button
                                onClick={() => navigate(`/courses/${courseId}/lectures/${prevLecture._id}`)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                style={{ background: PLAYER_THEME.panelAlt, border: `1px solid ${PLAYER_THEME.border}`, color: PLAYER_THEME.secondaryText }}
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Prev</span>
                            </button>
                        )}
                        {nextLecture && (
                            <button
                                onClick={handleNextLecture}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                                style={{ background: 'var(--color-primary)', border: 'none', color: '#000' }}
                            >
                                <span>Next</span>
                                <ChevronRight className="w-4 h-4 stroke-[3px]" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main: Player + Sidebar */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">

                {/* Video Area */}
                {!shouldStartQuiz && (
                    <div className="shrink-0 lg:flex-1 flex flex-col items-center lg:justify-center p-0 sm:p-2 lg:p-4 min-h-0 relative" style={{ background: PLAYER_THEME.pageBg }}>
                        <div className="w-full max-w-6xl mx-auto aspect-video relative">
                            <div className="w-full h-full rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,255,128,0.25)', boxShadow: PLAYER_THEME.shadow }}>
                                <VideoPlayer
                                    courseId={courseId}
                                    lectureId={lectureId}
                                    youtubeId={currentLecture.youtubeId}
                                    startTime={currentLecture.startTime}
                                    endTime={currentLecture.endTime}
                                    onEnded={handleVideoEnd}
                                    onTimeUpdate={handleTimeUpdate}
                                    seekTo={seekTo}
                                />
                            </div>
                        </div>

                        {/* XP Earned floating toast */}
                        <AnimatePresence>
                            {xpEarned && (
                                <motion.div
                                    key="xp-toast"
                                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, y: -20, scale: 1 }}
                                    exit={{ opacity: 0, y: -60, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute top-3 sm:top-8 right-3 sm:right-8 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-black text-sm sm:text-lg pointer-events-none"
                                    style={{ background: 'rgba(245,165,36,0.2)', border: '1px solid rgba(245,165,36,0.6)', color: '#f5a524', boxShadow: '0 0 20px rgba(245,165,36,0.4)' }}
                                >
                                    <img src="/favicon.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" /> +{xpEarned} XP
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Completion Card */}
                        <AnimatePresence>
                            {showCompletionCard && (
                                <motion.div
                                    initial={{ y: 80, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 80, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                    className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[94%] sm:w-[90%] max-w-md rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center z-50 shadow-2xl"
                                    style={{ background: PLAYER_THEME.completionBg, border: PLAYER_THEME.completionBorder, backdropFilter: 'blur(20px)' }}
                                >
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                        <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-1" style={{ color: PLAYER_THEME.text }}>Mission Complete!</h3>
                                    <p className="text-sm font-bold mb-6" style={{ color: '#f5a524' }}>+{xpEarned || 50} XP Earned</p>
                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={() => navigate(`/courses/${courseId}`)}
                                            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-colors"
                                            style={{ background: PLAYER_THEME.completionBtnBg, border: `1px solid ${PLAYER_THEME.completionBtnBorder}`, color: PLAYER_THEME.completionBtnText }}
                                        >
                                            Overview
                                        </button>
                                        <button
                                            onClick={handleNextLecture}
                                            className="flex-[2] py-3 px-4 rounded-xl text-sm font-bold transition-all btn-esports"
                                        >
                                            {nextLecture ? '⚡ Continue' : '🏆 Finish Course'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Right Sidebar */}
                <div ref={sidebarRef} className={`flex-1 w-full shrink-0 flex flex-col border-t lg:border-t-0 min-h-[500px] lg:min-h-0 ${shouldStartQuiz ? '' : 'lg:flex-none lg:w-[380px] xl:w-[420px] lg:border-l'}`} style={{ borderColor: PLAYER_THEME.border, background: PLAYER_THEME.panelBg }}>

                    {/* Tab Navigation */}
                    <div className="flex border-b shrink-0" style={{ borderColor: PLAYER_THEME.border }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold transition-colors border-b-2"
                                style={{
                                    borderBottomColor: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                                    color: activeTab === tab.key ? 'var(--color-primary)' : PLAYER_THEME.muted,
                                    background: activeTab === tab.key ? 'rgba(0,255,128,0.05)' : 'transparent'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {activeTab === 'timeline' && (
                            <TimelineSidebar
                                allLectures={allLectures}
                                currentLectureId={lectureId}
                                completedLectures={progress?.completedLectures || []}
                                onLectureClick={(id) => navigate(`/courses/${courseId}/lectures/${id}`)}
                                onToggleComplete={handleToggleCompletion}
                                courseId={courseId}
                            />
                        )}
                        {activeTab === 'notes' && (
                            <NotesTab
                                lectureId={currentLecture._id}
                                courseId={courseId}
                                onSeek={handleTopicClick}
                                notesStatus={currentAiStatus.notes || 'pending'}
                                errorReason={currentAiStatus.errorReason}
                                aiStatus={currentAiStatus}
                            />
                        )}
                        {activeTab === 'quiz' && (
                            <QuizTab
                                lectureId={currentLecture._id}
                                aiStatus={currentAiStatus}
                                autoStart={quizAutoStart || shouldStartQuiz}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Doubt Chatbot - Simple LLM */}
            {!isMobile && (
                <DoubtChatbot
                    lectureId={lectureId}
                    courseTitle={course?.title || ''}
                    lectureTitle={currentLecture?.title || ''}
                />
            )}
        </div>
    );
};

export default Player;
