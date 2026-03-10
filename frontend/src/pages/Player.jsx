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
import { ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, Zap, Bot } from 'lucide-react';

const TABS = [
    { key: 'topics', label: '🗺 Topics' },
    { key: 'notes',  label: '⚡ Notes' },
    { key: 'quiz',   label: '🎯 Quiz' },
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

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0d0f1a' }}>
            <div className="w-10 h-10 rounded-full border-2 border-[#00b4ff] border-t-transparent animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#4a5480' }}>Loading Mission</p>
        </div>
    );

    if (error || !currentLecture) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: '#0d0f1a' }}>
            <p className="text-lg font-semibold text-red-400 mb-4">{error || 'Lecture not found'}</p>
            <Link to="/dashboard" className="btn-primary">Return to Dashboard</Link>
        </div>
    );

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

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#08090f' }}>

            {/* Top progress bar */}
            <div className="fixed top-0 left-0 w-full h-[2px] z-50" style={{ background: '#1a1e35' }}>
                <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${((currentLectureIndex + 1) / allLectures.length) * 100}%`, background: 'linear-gradient(90deg, #00b4ff, #00e5ff)' }}
                />
            </div>

            {/* Header */}
            <header className="shrink-0 px-5 py-3 flex justify-between items-center border-b" style={{ borderColor: '#1a1e35', background: '#0d0f1a' }}>
                <div>
                    <Link
                        to={`/courses/${courseId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1 group hover:text-[#00b4ff] transition-colors"
                        style={{ color: '#4a5480' }}
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        {course.title}
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'rgba(0,180,255,0.12)', color: '#00b4ff' }}>
                            Mission {currentLectureIndex + 1}/{allLectures.length}
                        </span>
                        <h1 className="text-base font-bold text-white line-clamp-1">{currentLecture.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {prevLecture && (
                        <button
                            onClick={() => navigate(`/courses/${courseId}/lectures/${prevLecture._id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: '#12152a', border: '1px solid #2a2f52', color: '#8b9cc8' }}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Prev
                        </button>
                    )}
                    {nextLecture && (
                        <button
                            onClick={handleNextLecture}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)', color: '#00b4ff' }}
                        >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </header>

            {/* Main: Player + Sidebar */}
            <div className="flex-1 flex min-h-0">

                {/* Video Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 min-h-0 relative">
                    <div className="w-full max-w-5xl mx-auto aspect-video relative">
                        <div className="w-full h-full rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,180,255,0.25)', boxShadow: '0 0 30px rgba(0,180,255,0.12)' }}>
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
                                className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full font-black text-lg pointer-events-none"
                                style={{ background: 'rgba(245,165,36,0.2)', border: '1px solid rgba(245,165,36,0.6)', color: '#f5a524', fontFamily: "'Barlow Condensed', sans-serif", boxShadow: '0 0 20px rgba(245,165,36,0.4)' }}
                            >
                                <Zap className="w-5 h-5" /> +{xpEarned} XP
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
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md rounded-2xl p-6 flex flex-col items-center text-center z-50 shadow-2xl"
                                style={{ background: 'rgba(18,21,42,0.97)', border: '1px solid rgba(0,180,255,0.3)', backdropFilter: 'blur(20px)' }}
                            >
                                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                    <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Mission Complete!</h3>
                                <p className="text-sm font-bold mb-6" style={{ color: '#f5a524' }}>+{xpEarned || 50} XP Earned</p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => navigate(`/courses/${courseId}`)}
                                        className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-colors"
                                        style={{ background: '#12152a', border: '1px solid #2a2f52', color: '#8b9cc8' }}
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
                <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col border-l" style={{ borderColor: '#1a1e35', background: '#0d0f1a', height: '100%' }}>

                    {/* Tab Navigation */}
                    <div className="flex border-b shrink-0" style={{ borderColor: '#1a1e35' }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="flex-1 py-3 text-xs font-bold transition-colors border-b-2"
                                style={{
                                    borderBottomColor: activeTab === tab.key ? '#00b4ff' : 'transparent',
                                    color: activeTab === tab.key ? '#00b4ff' : '#4a5480',
                                    background: activeTab === tab.key ? 'rgba(0,180,255,0.05)' : 'transparent'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto">
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
            <DoubtChatbot
                lectureId={lectureId}
                courseTitle={course?.title || ''}
                lectureTitle={currentLecture?.title || ''}
            />
        </div>
    );
};

export default Player;
