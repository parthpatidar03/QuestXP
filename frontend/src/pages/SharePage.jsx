import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Share2, BookOpen, Clock, Play, CheckCircle, ArrowLeft, Copy, Check } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { BGPattern } from '../components/ui/bg-pattern';
import NavBar from '../components/NavBar';
import Footer from '../components/ui/Footer';

const SharePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cloning, setCloning] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await api.get(`/courses/share/${courseId}`);
                setCourse(data.course);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load shared course');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId]);

    const handleClone = async () => {
        if (!user) {
            // Save current path to return after login
            localStorage.setItem('redirectAfterLogin', `/share/${courseId}`);
            navigate('/login');
            return;
        }

        setCloning(true);
        try {
            const { data } = await api.post(`/courses/share/${courseId}/clone`);
            navigate(`/courses/${data.courseId}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to clone course');
            setCloning(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0 min';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg text-text-primary flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Loading Shared Course...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-bg text-text-primary flex flex-col">
                <NavBar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="glass-card p-10 max-w-md w-full text-center border-danger/20">
                        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                        <p className="text-text-secondary mb-8">{error || 'Course not found'}</p>
                        <Link to="/" className="btn-primary inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg text-text-primary relative overflow-hidden flex flex-col">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-primary)" className="opacity-5" />
            <NavBar />
            
            <main className="flex-1 relative z-10 py-12 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-bold uppercase tracking-widest">Back to Dashboard</span>
                        </Link>
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                        Shared Course
                                    </span>
                                    <span className="text-xs text-text-muted font-bold">
                                        {course.totalLectures} Missions • {formatDuration(course.totalDuration)}
                                    </span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text-primary leading-tight">
                                    {course.title}
                                </h1>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleCopyLink}
                                    className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm font-bold flex items-center gap-2 hover:bg-surface-2 transition-all"
                                >
                                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </button>
                                <button 
                                    onClick={handleClone}
                                    disabled={cloning}
                                    className="btn-esports px-8 py-2.5 text-base flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {cloning ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            Cloning...
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-5 h-5" />
                                            {user ? 'Clone to My Profile' : 'Login to Join'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="glass-card p-6">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    Course Curriculum
                                </h2>
                                <div className="space-y-4">
                                    {course.sections.map((section, idx) => (
                                        <div key={idx} className="border border-border/40 rounded-xl overflow-hidden bg-surface-2/50">
                                            <div className="px-5 py-4 bg-surface-2 border-b border-border/40 flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-text-primary">{section.title}</h3>
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter">
                                                    {section.lectures.length} Missions
                                                </span>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                {section.lectures.map((lecture, lIdx) => (
                                                    <div key={lIdx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors group">
                                                        <div className="w-16 h-10 rounded overflow-hidden shrink-0 border border-border group-hover:border-primary/30 transition-colors">
                                                            {lecture.thumbnailUrl ? (
                                                                <img src={lecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-surface flex items-center justify-center">
                                                                    <Play className="w-3 h-3 text-text-muted" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-text-primary truncate">{lecture.title}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Clock className="w-3 h-3 text-text-muted" />
                                                                <span className="text-[10px] text-text-muted font-bold">{formatDuration(lecture.duration)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="glass-card p-6 border-primary/20 bg-primary/[0.02]">
                                <h3 className="font-bold text-sm mb-3 uppercase tracking-widest text-primary">Why Clone?</h3>
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle className="w-3 h-3" />
                                        </div>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            <strong className="text-text-primary">Separate Progress:</strong> Your study stats and completion history won't affect the original owner.
                                        </p>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle className="w-3 h-3" />
                                        </div>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            <strong className="text-text-primary">Custom Study Plan:</strong> Generate your own roadmap based on your personal deadlines.
                                        </p>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle className="w-3 h-3" />
                                        </div>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            <strong className="text-text-primary">Instant Access:</strong> All AI-generated notes, summaries, and quizzes are ready immediately.
                                        </p>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="glass-card p-6 text-center">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-sm mb-2">Ready to level up?</h3>
                                <p className="text-xs text-text-secondary mb-6">Clone this course and start your quest today.</p>
                                <button 
                                    onClick={handleClone}
                                    disabled={cloning}
                                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    {cloning ? 'Processing...' : (user ? 'Join Course' : 'Login to Join')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default SharePage;
