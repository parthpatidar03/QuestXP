import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Trophy, Shield, BookOpen, Plus, ChevronRight, Star, Trash2, Target, MessageSquare, Share2, Copy, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import api from '../services/api';
import { getGamificationProfile, getXPHistory } from '../services/gamificationApi';
import NavBar from '../components/NavBar';
import DailyMissionWidget from '../components/Dashboard/DailyMissionWidget';
import UserTour from '../components/Dashboard/UserTour';

import StreakCalendar from '../components/StreakCalendar';
import CourseCreationForm from '../components/Course/CourseCreationForm';
import { BGPattern } from '../components/ui/bg-pattern';
import FeedbackModal from '../components/FeedbackModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatCardSkeleton, CourseCardSkeleton } from '../components/ui/Skeleton';
import Footer from '../components/ui/Footer';
import UsernameModal from '../components/Dashboard/UsernameModal';
import { BarChart3, Clock, Calendar, ArrowUpRight, TrendingUp, Crown } from 'lucide-react';
import GlobalLeaderboardModal from '../components/Dashboard/GlobalLeaderboardModal';
import GenerateRoadmapModal from '../components/Roadmap/GenerateRoadmapModal';


/* ── Helpers ─────────────────────────────────────────────────────────── */
const XP_PER_LECTURE = 50;

function calcCourseProgress(course, progress) {
    const total = course?.totalLectures || 1;
    const done = progress?.completedLectures?.length || 0;
    return Math.round((done / total) * 100);
}

/* ── Productivity Cards ─────────────────────────────────────────────── */
function RankCard({ rank, percentile, trend }) {
    return (
        <div className="glass-card p-5 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gold/10 text-gold border border-gold/20">
                    <Crown className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Rank Position</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-text-primary tracking-tight">#{rank || '—'}</span>
                {trend === 'up' && (
                    <span className="text-xs font-bold text-success flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> Trend Up
                    </span>
                )}
            </div>
            <p className="text-xs font-semibold text-text-secondary">
                <span className="text-primary">Top {percentile}%</span> of learners this week
            </p>
        </div>
    );
}

const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '—';
    const s = parseInt(seconds);
    if (s < 3600) {
        const m = s / 60;
        return `${m % 1 === 0 ? m : m.toFixed(1)} min`;
    }
    const h = s / 3600;
    return `${h % 1 === 0 ? h : h.toFixed(1)} hr`;
};



function LearningTimeCard({ totalSeconds, weeklySeconds, avgSecondsPerDay }) {
    const hasActivity = totalSeconds > 0;

    return (
        <div className="glass-card p-5 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                    <Clock className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Learning Time</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-text-primary tracking-tight">
                    {formatTime(totalSeconds)}
                </span>
                <span className="text-xs font-bold text-text-muted">{hasActivity ? 'Total' : 'No activity yet'}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">This Week</span>
                    <span className="text-sm font-black text-text-primary">{formatTime(weeklySeconds)}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Daily Avg</span>
                    <span className="text-sm font-black text-text-primary">{formatTime(avgSecondsPerDay)}</span>
                </div>
            </div>
        </div>
    );
}

function DeadlineCard({ deadline }) {
    if (!deadline || !deadline.courseTitle) {
        return (
            <div className="glass-card p-5 flex flex-col justify-center items-center text-center opacity-80 hover:opacity-100 transition-opacity">
                <Calendar className="w-8 h-8 text-text-muted mb-2 opacity-30" />
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No Active Targets</p>
                <p className="text-[10px] text-text-muted mt-1">Set a study plan to see targets</p>
            </div>
        );
    }

    const isUrgent = deadline.daysLeft <= 2;

    return (
        <div 
            className={`glass-card p-5 relative overflow-hidden group hover:scale-[1.02] transition-all border-l-4 ${isUrgent ? 'border-l-danger bg-danger/[0.02]' : 'border-l-primary'}`}
        >
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUrgent ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'} border border-border`}>
                    <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Next Milestone</span>
            </div>
            <h4 className="text-sm font-black text-text-primary truncate mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {deadline.courseTitle}
            </h4>
            <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold ${isUrgent ? 'text-danger' : 'text-text-secondary'}`}>
                    {deadline.daysLeft} Days Left
                </span>
                <span className="text-[10px] font-bold text-text-muted">{deadline.progress}%</span>
            </div>
            <div className="progress-bar h-1.5 bg-surface-3">
                <div 
                    className={`progress-bar__fill ${isUrgent ? 'bg-danger' : 'bg-primary'}`} 
                    style={{ width: `${deadline.progress}%` }} 
                />
            </div>
        </div>
    );
}

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
                            <MessageSquare className="w-4 h-4" />
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

function ProductivityCard({ completionRate, completedCourses, totalEnrolled }) {
    return (
        <div className="glass-card p-5 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-success/10 text-success border border-success/20">
                    <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Mastery Level</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-text-primary tracking-tight">{completionRate}%</span>
                <span className="text-xs font-bold text-text-muted">Global</span>
            </div>
            <p className="text-xs font-semibold text-text-secondary">
                <span className="text-success">{completedCourses}</span> courses mastered out of {totalEnrolled}
            </p>
        </div>
    );
}

/* ── Course Card ────────────────────────────────────────────────────── */
function CourseCard({ course, progress, onDelete, isDeleting }) {
    const pct = calcCourseProgress(course, progress);
    const xpPool = (course?.totalLectures || 0) * XP_PER_LECTURE;
    const thumb = course?.thumbnailUrl || course?.sections?.[0]?.lectures?.[0]?.thumbnailUrl;

    const completed = new Set(progress?.completedLectures || []);
    let nextLecture = null;
    outer: for (const sec of course?.sections || []) {
        for (const lec of sec.lectures || []) {
            if (!completed.has(lec._id)) { nextLecture = lec; break outer; }
        }
    }
    const resumeId = nextLecture?._id || course?.sections?.[0]?.lectures?.[0]?._id;
    const [shareStatus, setShareStatus] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const handleShare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/share/${course._id}`;
        navigator.clipboard.writeText(shareUrl);
        setShareStatus('Copied!');
        setIsShareModalOpen(true);
        setTimeout(() => setShareStatus(''), 2000);
    };

    return (
        <>
        <ShareModal 
            isOpen={isShareModalOpen} 
            onClose={() => setIsShareModalOpen(false)} 
            courseTitle={course.title}
            shareUrl={`${window.location.origin}/share/${course._id}`}
        />
        <Link to={`/courses/${course._id}`} className="glass-card group block transition-all" style={{ padding: 0, overflow: 'hidden' }}>
            <div
                className="relative w-full aspect-video overflow-hidden"
            >
                {thumb ? (
                    <img 
                        src={thumb} 
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-2">
                        <BookOpen className="w-10 h-10 text-text-muted" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />

                <div className="absolute top-2 right-2 xp-chip">
                    <img src="/favicon.png" alt="" className="w-3 h-3 object-contain" /> +{xpPool} XP
                </div>
                <button
                    type="button"
                    className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/85 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(course);
                    }}
                    disabled={isDeleting}
                    aria-label={`Delete ${course.title}`}
                    title="Delete course permanently"
                >
                    <Trash2 className="w-3 h-3" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                    type="button"
                    className="absolute top-2 left-[5.5rem] inline-flex items-center gap-1 rounded-full border border-indigo-500/50 bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white transition-all hover:bg-indigo-700 hover:scale-105 shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={handleShare}
                    aria-label={`Share ${course.title}`}
                    title="Copy share link"
                >
                    <Share2 className="w-3 h-3" />
                    {shareStatus || 'Share'}
                </button>
                <div className="absolute bottom-2 left-2 bg-surface/90 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ color: pct === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>
                    {pct}%
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-serif font-bold text-text-primary text-base leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                <div className="progress-bar mb-2">
                    <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{course.totalLectures} missions</span>
                    <span>{pct}% complete</span>
                </div>
                {resumeId && (
                    <div className="mt-2 text-xs font-semibold text-primary">
                        <span className="flex items-center gap-1 hover:underline">
                            Resume Mission <ChevronRight className="w-3 h-3" />
                        </span>
                    </div>
                )}
            </div>
        </Link>
        </>
    );
}

/* ── Dashboard ──────────────────────────────────────────────────────── */
const Dashboard = () => {
    const { user } = useAuthStore();
    const { totalXP, level, levelTitle, streak, xpProgress, xpToNextLevel, setProfile } = useGamificationStore();
    const queryClient = useQueryClient();

    const [showCreate, setShowCreate] = useState(false);
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [roadmapCourseId, setRoadmapCourseId] = useState(null);
    const [optimisticHiddenIds, setOptimisticHiddenIds] = useState(new Set());
    const [showUndo, setShowUndo] = useState(null); // { id, title, timer }
    const [undoCountdown, setUndoCountdown] = useState(0);

    useEffect(() => {
        if (user && !user.usernameSet) {
            setShowUsernameModal(true);
        }
    }, [user]);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const handleOpenLeaderboard = () => setShowLeaderboard(true);
        window.addEventListener('open-leaderboard', handleOpenLeaderboard);
        return () => window.removeEventListener('open-leaderboard', handleOpenLeaderboard);
    }, []);

    useEffect(() => {
        if (searchParams.get('open') === 'leaderboard') {
            setShowLeaderboard(true);
            // Clear param without adding to history
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stats');
            return data;
        },
        enabled: !!user
    });

    const { data: leaderboardData = [] } = useQuery({
        queryKey: ['global-leaderboard'],
        queryFn: async () => {
            const { data } = await api.get('/gamification/leaderboard');
            return data;
        },
        enabled: !!user
    });
    const [visibleCount, setVisibleCount] = useState(6);

    // ── Queries ──────────────────────────────────────────────────────────

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const data = await getGamificationProfile();
            setProfile(data);
            return data;
        }
    });

    const { data: historyData = [] } = useQuery({
        queryKey: ['xpHistory'],
        queryFn: getXPHistory
    });

    const { data: coursesData, isLoading: coursesLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: async () => {
            const { data } = await api.get('/courses');
            return data.courses || [];
        },
        refetchInterval: (data) => {
            const hasProcessing = data?.state?.data?.some(c => c.status === 'processing');
            return hasProcessing ? 3000 : false;
        }
    });

    const { data: progressMap = {}, isLoading: progressLoading } = useQuery({
        queryKey: ['progress'],
        queryFn: async () => {
            const courses = await queryClient.ensureQueryData({ queryKey: ['courses'] });
            const pMap = {};
            await Promise.allSettled(courses.map(async c => {
                try {
                    const p = await api.get(`/progress/${c._id}`);
                    if (p.data.progress) pMap[c._id] = p.data.progress;
                } catch (_) {}
            }));
            return pMap;
        },
        enabled: !!coursesData
    });

    const deleteMutation = useMutation({
        mutationFn: async (courseId) => api.delete(`/courses/${courseId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['progress'] });
        },
        onError: (err) => {
            setDeleteError(err.response?.data?.error || 'Failed to delete course.');
        }
    });


    const handleDeleteCourse = async (course) => {
        // Cleanup previous undo if exists
        if (showUndo) {
            clearTimeout(showUndo.timer);
            if (showUndo.interval) clearInterval(showUndo.interval);
        }

        // Optimistic UI Removal
        setOptimisticHiddenIds(prev => new Set(prev).add(course._id));
        setUndoCountdown(5);
        
        const timer = setTimeout(() => {
            deleteMutation.mutate(course._id, {
                onSettled: () => {
                    setDeletingCourseId(null);
                    setShowUndo(null);
                    setUndoCountdown(0);
                }
            });
        }, 5000);

        // Countdown interval
        const interval = setInterval(() => {
            setUndoCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setShowUndo({ id: course._id, title: course.title, timer, interval });
        setDeletingCourseId(course._id);
    };

    const handleUndoDelete = () => {
        if (!showUndo) return;
        clearTimeout(showUndo.timer);
        if (showUndo.interval) clearInterval(showUndo.interval);
        
        setOptimisticHiddenIds(prev => {
            const next = new Set(prev);
            next.delete(showUndo.id);
            return next;
        });
        setDeletingCourseId(null);
        setShowUndo(null);
        setUndoCountdown(0);
    };


    if (!user) return null;

    const courses = coursesData || [];
    const activeCourse = courses[0];
    const activePct = activeCourse ? calcCourseProgress(activeCourse, progressMap[activeCourse._id]) : 0;
    const firstLecId = activeCourse?.sections?.[0]?.lectures?.[0]?._id;


    return (
        <div className="min-h-screen bg-bg text-text-primary relative overflow-hidden">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-primary)" className="opacity-5" />
            <NavBar />

            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col xl:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-8">
                    {activeCourse && (
                        <Link 
                            id="tour-hero"
                            to={firstLecId ? `/courses/${activeCourse._id}/lectures/${firstLecId}` : `/courses/${activeCourse._id}`}

                            className="relative rounded-xl overflow-hidden p-7 flex flex-col sm:flex-row gap-6 items-start bg-surface border border-border shadow-card hover:border-primary/50 group transition-all"
                        >
                            {activeCourse.sections?.[0]?.lectures?.[0]?.thumbnailUrl && (
                                <img
                                    src={activeCourse.sections[0].lectures[0].thumbnailUrl}
                                    alt="course"
                                    className="w-32 h-20 sm:w-44 sm:h-28 object-cover rounded-lg shrink-0 border border-border group-hover:scale-105 transition-transform duration-500"
                                />
                            )}

                            <div className="relative flex-1 min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-primary">Continue studying</p>
                                <h1 className="text-2xl sm:text-4xl font-serif font-black text-text-primary mb-2 leading-none group-hover:text-primary transition-colors tracking-tight">
                                    {activeCourse.title}
                                </h1>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="xp-chip"><img src="/favicon.png" alt="" className="w-3 h-3 object-contain" /> {Math.floor(activePct * (activeCourse.totalLectures * XP_PER_LECTURE) / 100)} / {activeCourse.totalLectures * XP_PER_LECTURE} XP</span>
                                    <span className="text-xs text-text-muted">{activePct > 0 ? `${activePct}% complete` : 'Ready to begin'}</span>
                                </div>
                                <div className="progress-bar mb-4 max-w-xs">
                                    <div className="progress-bar__fill" style={{ width: `${activePct}%` }} />
                                </div>
                                
                                <div className="btn-esports inline-flex items-center gap-2 text-sm group-hover:bg-primary-hover transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                    Resume Mission
                                </div>
                            </div>
                        </Link>
                    )}


                    <section id="tour-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {statsLoading ? (
                            Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
                        ) : (
                            <>
                                <RankCard 
                                    rank={stats?.rank?.current} 
                                    percentile={stats?.rank?.percentile} 
                                    trend={stats?.rank?.trend} 
                                />
                                <LearningTimeCard 
                                    totalSeconds={stats?.learningTime?.totalSeconds} 
                                    weeklySeconds={stats?.learningTime?.weeklySeconds} 
                                    avgSecondsPerDay={stats?.learningTime?.avgSecondsPerDay} 
                                />
                                <DeadlineCard deadline={stats?.deadlines} />
                                <ProductivityCard 
                                    completionRate={stats?.productivity?.completionRate} 
                                    completedCourses={stats?.productivity?.completedCourses} 
                                    totalEnrolled={stats?.productivity?.totalEnrolled} 
                                />
                            </>
                        )}
                    </section>


                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold tracking-tight text-text-primary">Active courses</h2>
                            <button id="tour-new-course" onClick={() => setShowCreate(v => !v)} className="btn-primary py-2 px-4 text-xs flex items-center gap-1">

                                <Plus className="w-3.5 h-3.5" />
                                {showCreate ? 'Cancel' : 'New Course'}
                            </button>
                            {user.role === 'admin' && (
                                <Link 
                                    to="/admin/feedback" 
                                    className="px-4 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors flex items-center gap-2"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Feedback Admin
                                </Link>
                            )}
                        </div>
                        {deleteError && (
                            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {deleteError}
                            </div>
                        )}
                        {showCreate && (
                            <div className="mb-6">
                                <CourseCreationForm onSuccess={(courseId) => {
                                    setShowCreate(false);
                                    setRoadmapCourseId(courseId);
                                    queryClient.invalidateQueries({ queryKey: ['courses'] });
                                }} />
                            </div>
                        )}
                        {coursesLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {Array(6).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
                            </div>
                        ) : courses.length === 0 && !showCreate ? (
                            <div className="glass-card flex flex-col items-center justify-center py-20 text-center border-dashed">
                                <BookOpen className="w-12 h-12 mb-4 text-text-muted" />
                                <h3 className="text-lg font-semibold text-text-primary mb-2">No courses yet</h3>
                                <p className="text-sm mb-6 text-text-secondary">Paste a YouTube playlist to generate your first course.</p>
                                <button onClick={() => setShowCreate(true)} className="btn-esports">Create your first course</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {courses
                                        .filter(c => !optimisticHiddenIds.has(c._id))
                                        .slice(0, visibleCount)
                                        .map(c => (
                                            <CourseCard
                                                key={c._id}
                                                course={c}
                                                progress={progressMap[c._id]}
                                                onDelete={handleDeleteCourse}
                                                isDeleting={deletingCourseId === c._id}
                                            />
                                        ))}
                                </div>
                                {visibleCount < courses.length && (
                                    <div className="flex justify-center pt-4">
                                        <button 
                                            onClick={() => setVisibleCount(prev => prev + 6)}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-surface text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all shadow-sm"
                                        >
                                            Load More Courses
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}


                    </section>
                </div>

                <aside className="flex flex-col w-full xl:w-72 shrink-0 space-y-4">
                    <div id="tour-mission">
                        <DailyMissionWidget />
                    </div>
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Flame className="w-4 h-4 text-warning" />
                            <h2 className="text-sm font-semibold tracking-wide text-text-primary">Study Streak</h2>
                        </div>
                        <StreakCalendar history={historyData} />
                    </div>


                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4 text-success" />
                            <h2 className="text-sm font-semibold tracking-wide text-text-primary">Daily Quests</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2 hover:border-success/50 transition-colors cursor-pointer group">
                                <div>
                                    <p className="text-sm font-medium text-text-primary group-hover:text-success transition-colors">Study for 15 minutes</p>
                                    <p className="text-xs text-text-secondary mt-0.5">Gain 50 XP</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:bg-success/10 group-hover:border-success/30 transition-colors p-1.5">
                                    <img src="/favicon.png" alt="" className="w-full h-full object-contain" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2 hover:border-success/50 transition-colors cursor-pointer group">
                                <div>
                                    <p className="text-sm font-medium text-text-primary group-hover:text-success transition-colors">Complete a Quiz</p>
                                    <p className="text-xs text-text-secondary mt-0.5">Gain 100 XP</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:bg-success/10 group-hover:border-success/30 transition-colors p-1.5">
                                    <img src="/favicon.png" alt="" className="w-full h-full object-contain" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Link to="/profile" className="glass-card block transition-all p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center font-semibold text-sm bg-primary text-white">
                                {user.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{user.name}</p>
                                <p className="text-xs text-text-secondary">{levelTitle || 'Explorer'} · Level {level || user?.level}</p>
                            </div>
                        </div>
                        <div className="progress-bar mb-1">
                            <div className="progress-bar__fill" style={{ width: `${xpProgress}%` }} />
                        </div>
                        <p className="text-xs text-right text-text-muted uppercase tracking-widest font-bold">
                            {xpToNextLevel} XP to Level {level + 1}
                        </p>
                    </Link>
                </aside>
            </div>

            <Footer onOpenFeedback={() => setFeedbackOpen(true)} />
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} contextPage="Dashboard" />
            <UsernameModal isOpen={showUsernameModal} onClose={() => setShowUsernameModal(false)} />
            <GlobalLeaderboardModal 
                isOpen={showLeaderboard} 
                onClose={() => setShowLeaderboard(false)} 
                players={leaderboardData} 
            />
            {roadmapCourseId && (
                <GenerateRoadmapModal 
                    isOpen={!!roadmapCourseId} 
                    onClose={() => setRoadmapCourseId(null)} 
                    courseId={roadmapCourseId} 
                />
            )}
            {!showUsernameModal && <UserTour />}

            {/* Undo Toast */}
            <AnimatePresence>
                {showUndo && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-6 py-4 bg-surface-2 border border-border rounded-2xl shadow-2xl"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Deleting in {undoCountdown}s</span>
                            <span className="text-sm font-black text-text-primary line-clamp-1">{showUndo.title}</span>
                        </div>
                        <button 
                            onClick={handleUndoDelete}
                            className="ml-4 px-4 py-2 bg-primary text-black text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            Undo Deletion
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

    );
};

export default Dashboard;
