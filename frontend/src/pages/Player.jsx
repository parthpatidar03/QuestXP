import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import VideoPlayer from '../components/Player/VideoPlayer';
import TopicSidebar from '../components/Player/TopicSidebar';
import NotesTab from '../components/Lecture/NotesTab';
import QuizTab from '../components/Lecture/QuizTab';
import DoubtChatbot from '../components/Lecture/DoubtChatbot';
import useGamificationStore from '../store/useGamificationStore';
import { ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { BGPattern } from '../components/ui/bg-pattern';

const TABS = [
    { key: 'topics', label: 'Topics' },
    { key: 'notes',  label: 'Notes' },
    { key: 'quiz',   label: 'Quiz' },
];

const Player = () => {
    const { courseId, lectureId } = useParams();
    const navigate = useNavigate();
    const { addXPToast, applyAward } = useGamificationStore();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [showCompletionCard, setShowCompletionCard] = useState(false);
    const [activeTab, setActiveTab] = useState('topics');
    const [xpEarned, setXpEarned] = useState(null); // golden XP toast value
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));
    const [isDark, setIsDark] = useState(() => (typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : true));
    const positionTimerRef = useRef(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await api.get(`/courses/${courseId}`);
                setCourse(data.course);
            } catch (err) {
                setError('Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
        setShowCompletionCard(false);
        setXpEarned(null);
        return () => { if (positionTimerRef.current) clearInterval(positionTimerRef.current); };
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
            if (currentTime > 5) {
                api.patch(`/progress/${courseId}/lectures/${lectureId}/position`, {
                    position: Math.floor(currentTime),
                    watchedSeconds: Math.floor(currentTime)
                }).catch(() => {});
            }
        }, 30000);
        return () => clearInterval(positionTimerRef.current);
    }, [courseId, lectureId, currentTime]);

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

    const handleTopicClick = (t) => setCurrentTime(t);

    const handleVideoEnd = async () => {
        setShowCompletionCard(true);
        try {
            // Send full duration so progressService completion check passes (>80%)
            const duration = Math.max(currentLecture.duration || 300, 30);
            const res = await api.patch(`/progress/${courseId}/lectures/${lectureId}/position`, {
                position: duration,
                watchedSeconds: duration
            });
            // Response shape: { completed, xpAwarded, completionPct, lectureProgress }
            const earned = res.data?.xpAwarded || 50;
            setXpEarned(earned);
            if (earned > 0) {
                addXPToast(earned, 'Mission Complete');
            }
            // Refresh gamification profile so NavBar XP updates
            try {
                const { getGamificationProfile } = await import('../services/gamificationApi');
                const profile = await getGamificationProfile();
                const { setProfile } = (await import('../store/useGamificationStore')).default.getState();
                setProfile(profile);
            } catch (_) {}
        } catch (_) {
            addXPToast(50, 'Mission Complete');
            setXpEarned(50);
        }
    };

    const handleNextLecture = () => nextLecture
        ? navigate(`/courses/${courseId}/lectures/${nextLecture._id}`)
        : navigate(`/courses/${courseId}`);

    const theme = isDark
        ? {
            pageBg: '#08090f',
            panelBg: '#0d0f1a',
            panelAlt: '#12152a',
            border: '#1a1e35',
            muted: '#4a5480',
            text: '#eef2ff',
            secondaryText: '#8b9cc8',
            patternFill: 'rgba(255,255,255,0.05)',
            progressTrack: '#1a1e35',
            shadow: '0 0 30px rgba(0,180,255,0.12)',
            completionBg: 'rgba(18,21,42,0.97)',
            completionBorder: '1px solid rgba(0,180,255,0.3)',
            completionBtnBg: '#12152a',
            completionBtnBorder: '#2a2f52',
            completionBtnText: '#8b9cc8',
        }
        : {
            pageBg: '#f3f6fb',
            panelBg: '#ffffff',
            panelAlt: '#f3f6fb',
            border: '#d8e1ef',
            muted: '#5f6e8a',
            text: '#172033',
            secondaryText: '#41506d',
            patternFill: 'rgba(23,32,51,0.06)',
            progressTrack: '#d8e1ef',
            shadow: '0 0 0 rgba(0,0,0,0)',
            completionBg: 'rgba(255,255,255,0.98)',
            completionBorder: '1px solid rgba(0,180,255,0.24)',
            completionBtnBg: '#eef3fb',
            completionBtnBorder: '#d8e1ef',
            completionBtnText: '#41506d',
        };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: theme.pageBg }}>
            <div className="w-10 h-10 rounded-full border-2 border-[#00b4ff] border-t-transparent animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: theme.muted }}>Loading Mission</p>
        </div>
    );

    if (error || !currentLecture) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: theme.pageBg }}>
            <p className="text-lg font-semibold mb-4" style={{ color: '#ef4444' }}>{error || 'Lecture not found'}</p>
            <Link to="/dashboard" className="btn-primary">Return to Dashboard</Link>
        </div>
    );

    return (
        <div
            className="h-dvh flex flex-col overflow-hidden relative"
            style={{ background: theme.pageBg }}
        >
            <BGPattern variant="grid" mask="fade-edges" fill={theme.patternFill} className="opacity-10 z-0" />

            {/* Top progress bar */}
            <div className="fixed top-0 left-0 w-full h-[2px] z-50" style={{ background: theme.progressTrack }}>
                <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${((currentLectureIndex + 1) / allLectures.length) * 100}%`, background: 'linear-gradient(90deg, #00b4ff, #00e5ff)' }}
                />
            </div>

            {/* Header */}
            <header className="shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 flex flex-col gap-2 border-b" style={{ borderColor: theme.border, background: theme.panelBg }}>
                <div className="flex items-start justify-between gap-3">
                    <Link
                        to={`/courses/${courseId}`}
                        className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider group hover:text-[#00b4ff] transition-colors"
                        style={{ color: theme.muted }}
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        {course.title}
                    </Link>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0" style={{ background: 'rgba(0,180,255,0.12)', color: '#00b4ff' }}>
                        Mission {currentLectureIndex + 1}/{allLectures.length}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm sm:text-base font-bold line-clamp-1 pr-2" style={{ color: theme.text }}>{currentLecture.title}</h1>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {prevLecture && (
                            <button
                                onClick={() => navigate(`/courses/${courseId}/lectures/${prevLecture._id}`)}
                                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors"
                                style={{ background: theme.panelAlt, border: `1px solid ${theme.border}`, color: theme.secondaryText }}
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Prev</span>
                            </button>
                        )}
                        {nextLecture && (
                            <button
                                onClick={handleNextLecture}
                                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors"
                                style={{ background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)', color: '#00b4ff' }}
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main: Player + Sidebar */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">

                {/* Video Area */}
                <div className="shrink-0 lg:flex-1 flex flex-col items-center lg:justify-center p-2 sm:p-4 lg:p-6 min-h-0 relative" style={{ background: theme.pageBg }}>
                    <div className="w-full max-w-5xl mx-auto aspect-video relative">
                        <div className="w-full h-full rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,180,255,0.25)', boxShadow: theme.shadow }}>
                            <VideoPlayer
                                courseId={courseId}
                                lectureId={lectureId}
                                youtubeId={currentLecture.youtubeId}
                                onEnded={handleVideoEnd}
                                onTimeUpdate={setCurrentTime}
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
                                style={{ background: 'rgba(245,165,36,0.2)', border: '1px solid rgba(245,165,36,0.6)', color: '#f5a524', fontFamily: "'Barlow Condensed', sans-serif", boxShadow: '0 0 20px rgba(245,165,36,0.4)' }}
                            >
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> +{xpEarned} XP
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
                                style={{ background: theme.completionBg, border: theme.completionBorder, backdropFilter: 'blur(20px)' }}
                            >
                                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                    <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
                                </div>
                                <h3 className="text-2xl font-black mb-1" style={{ color: theme.text, fontFamily: "'Barlow Condensed', sans-serif" }}>Mission Complete!</h3>
                                <p className="text-sm font-bold mb-6" style={{ color: '#f5a524' }}>+{xpEarned || 50} XP Earned</p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => navigate(`/courses/${courseId}`)}
                                        className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-colors"
                                        style={{ background: theme.completionBtnBg, border: `1px solid ${theme.completionBtnBorder}`, color: theme.completionBtnText }}
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

                {/* Right Sidebar */}
                <div className="flex-1 lg:flex-none w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l min-h-0" style={{ borderColor: theme.border, background: theme.panelBg, height: '100%' }}>

                    {/* Tab Navigation */}
                    <div className="flex border-b shrink-0" style={{ borderColor: theme.border }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold transition-colors border-b-2"
                                style={{
                                    borderBottomColor: activeTab === tab.key ? '#00b4ff' : 'transparent',
                                    color: activeTab === tab.key ? '#00b4ff' : theme.muted,
                                    background: activeTab === tab.key ? 'rgba(0,180,255,0.05)' : 'transparent'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {activeTab === 'topics' && (
                            <TopicSidebar
                                topics={currentLecture.topics || []}
                                currentTime={currentTime}
                                onTopicClick={handleTopicClick}
                            />
                        )}
                        {activeTab === 'notes' && (
                            <NotesTab
                                lectureId={currentLecture._id}
                                courseId={courseId}
                                onSeek={handleTopicClick}
                                notesStatus={currentLecture.aiStatus?.notes || 'pending'}
                                errorReason={currentLecture.aiStatus?.errorReason}
                            />
                        )}
                        {activeTab === 'quiz' && (
                            <QuizTab
                                lectureId={currentLecture._id}
                                quizStatus={currentLecture.aiStatus?.quiz || 'pending'}
                                errorReason={currentLecture.aiStatus?.errorReason}
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
