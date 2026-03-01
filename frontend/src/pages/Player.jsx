import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import VideoPlayer from '../components/Player/VideoPlayer';
import TopicSidebar from '../components/Player/TopicSidebar';
import { ArrowLeft, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const Player = () => {
    const { courseId, lectureId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true); // default to true when page loads
    const [showCompletionCard, setShowCompletionCard] = useState(false);

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
        
        // Reset state on lecture change
        setIsVideoPlaying(true);
        setShowCompletionCard(false);
    }, [courseId, lectureId]);

    const allLectures = useMemo(() => {
        if (!course) return [];
        return course.sections.flatMap(section => section.lectures);
    }, [course]);

    const currentSectionIndex = useMemo(() => {
        if (!course) return -1;
        return course.sections.findIndex(s => s.lectures.some(l => l._id === lectureId));
    }, [course, lectureId]);

    const currentLectureIndex = useMemo(() => {
        return allLectures.findIndex(l => l._id === lectureId);
    }, [allLectures, lectureId]);

    const currentLecture = allLectures[currentLectureIndex];
    const prevLecture = currentLectureIndex > 0 ? allLectures[currentLectureIndex - 1] : null;
    const nextLecture = currentLectureIndex < allLectures.length - 1 ? allLectures[currentLectureIndex + 1] : null;

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4"></div>
            <p className="text-text-muted text-sm uppercase tracking-wider font-semibold">Loading Player</p>
        </div>
    );
    
    if (error || !currentLecture) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
            <div className="text-danger mb-4 text-center">
                <p className="text-lg font-semibold">{error || 'Lecture not found'}</p>
                <Link to="/dashboard" className="text-primary hover:underline mt-4 inline-block text-sm">Return to Dashboard</Link>
            </div>
        </div>
    );

    const handleTopicClick = (startTime) => {
        console.log(`Seek to ${startTime}`);
    };

    const handleVideoEnd = () => {
        setIsVideoPlaying(false);
        setShowCompletionCard(true);
        
        // In a real app, we would make an API call to record completion here
        // api.post('/progress', { courseId, lectureId, status: 'completed' })
    };

    const handleNextLecture = () => {
        if (nextLecture) {
            navigate(`/courses/${courseId}/lectures/${nextLecture._id}`);
        } else {
            navigate(`/courses/${courseId}`);
        }
    };

    return (
        <div className="min-h-screen bg-black text-text-primary flex flex-col h-screen font-body relative overflow-hidden">
            {/* 1px Top Progress Bar (Visible even during playback) */}
            <div className="fixed top-0 left-0 w-full h-[1px] bg-surface-2 z-50">
                <div 
                    className="h-full bg-primary" 
                    style={{ width: `${((currentLectureIndex + 1) / allLectures.length) * 100}%` }}
                ></div>
            </div>

            {/* Minimal Header */}
            <header className="px-6 py-4 flex justify-between items-center z-10 shrink-0">
                <div>
                    <Link className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-white transition-colors mb-1 group uppercase tracking-wider" to={`/courses/${courseId}`}>
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
                        {course.title}
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs bg-surface-2 text-text-secondary px-2 py-0.5 rounded border border-border">
                            Sec {currentSectionIndex + 1}
                        </span>
                        <h1 className="text-lg font-display font-semibold text-white line-clamp-1">{currentLecture.title}</h1>
                    </div>
                </div>
            </header>

            {/* Main Player Area */}
            <div className="flex-grow flex flex-col lg:flex-row min-h-0 bg-black">
                {/* Video Area (True Black) */}
                <div className="flex-grow p-4 lg:p-8 flex flex-col items-center justify-center min-h-0 relative z-0">
                    <div className="w-full max-w-6xl mx-auto aspect-video relative">
                        <VideoPlayer 
                            courseId={courseId}
                            lectureId={lectureId}
                            youtubeId={currentLecture.youtubeId}
                            onEnded={handleVideoEnd}
                        />
                    </div>
                </div>
                
                {/* Sidebar */}
                <div className="w-full lg:w-[340px] flex-shrink-0 h-80 lg:h-auto bg-surface overflow-hidden relative z-10">
                    <TopicSidebar 
                        topics={currentLecture.topics || []}
                        currentTime={currentTime}
                        onTopicClick={handleTopicClick}
                    />
                </div>
            </div>

            {/* Completion Card (Slide in from bottom when video ends) */}
            <AnimatePresence>
                {showCompletionCard && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 z-50 flex flex-col items-center text-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4 text-success">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-text-primary mb-1">Lecture Complete!</h3>
                        <p className="text-sm font-bold text-primary mb-6">+30 XP Earned</p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => navigate(`/courses/${courseId}`)}
                                className="flex-1 py-3 px-4 rounded-xl bg-surface-2 text-text-secondary font-semibold hover:text-text-primary hover:bg-surface-3 transition-colors text-sm border border-border"
                            >
                                Overview
                            </button>
                            <button 
                                onClick={handleNextLecture}
                                className="flex-[2] py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors text-sm shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                            >
                                {nextLecture ? 'Continue to Next' : 'Finish Course'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Player;
