import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Trophy, Shield, BookOpen, Plus, CheckCircle2, ChevronRight, Star, Trash2, Target, MessageSquare, Share2, Copy, Github, Monitor, Smartphone, Layout, Bell, Sparkles, Check, Clock, Info, X, PlayCircle, RefreshCw, Camera, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import api from '../services/api';
import { getGamificationProfile, getXPHistory } from '../services/gamificationApi';
import NavBar from '../components/NavBar';
import DailyMissionWidget from '../components/Dashboard/DailyMissionWidget';
import UserTour from '../components/Dashboard/UserTour';

import StreakCalendar from '../components/StreakCalendar';
import CourseCreationForm from '../components/Course/CourseCreationForm';
import { shootFireworks } from '../utils/confetti';
import { BGPattern } from '../components/ui/bg-pattern';
import FeedbackModal from '../components/FeedbackModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatCardSkeleton, CourseCardSkeleton } from '../components/ui/Skeleton';
import Footer from '../components/ui/Footer';
import UsernameModal from '../components/Dashboard/UsernameModal';
import { BarChart3, Calendar, ArrowUpRight, TrendingUp, Crown } from 'lucide-react';
import GlobalLeaderboardModal from '../components/Dashboard/GlobalLeaderboardModal';
import GenerateRoadmapModal from '../components/Roadmap/GenerateRoadmapModal';


/* ── Helpers ─────────────────────────────────────────────────────────── */
const XP_PER_LECTURE = 50;

function calcCourseProgress(course, progress) {
    const total = course?.totalLectures || 1;
    const done = progress?.completedLectures?.length || 0;
    return Math.round((done / total) * 100);
}

/* ── Bonus Rewards Widget ───────────────────────────────────────────── */
function BonusRewardsWidget() {
    return (
        <div className="glass-card p-5 border-l-4 border-l-warning flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                    <Star className="w-5 h-5 fill-warning/20" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-text-primary uppercase tracking-widest">Bonus Rewards</h4>
                    <p className="text-xs text-text-secondary">Complete 3 missions today for a +200 XP multiplier!</p>
                </div>
            </div>
            <button className="text-xs font-bold text-warning hover:underline uppercase">View Details</button>
        </div>
    );
}

/* ── Productivity Cards ─────────────────────────────────────────────── */
function RankCard({ rank, percentile, trend }) {
    return (
        <div className="glass-card p-5 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gold/10 border border-gold/20 overflow-hidden">
                    <img src="/Trophy rank.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Rank Position</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1 overflow-hidden">
                <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight truncate">#{rank || '—'}</span>
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
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 overflow-hidden">
                    <img src="/Learning time.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Learning Time</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1 overflow-hidden">
                <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight truncate">
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
            <div className="glass-card p-5 flex flex-col justify-center items-center text-center">
                <Calendar className="w-8 h-8 text-primary mb-2 opacity-40" />
                <p className="text-sm font-black text-text-secondary uppercase tracking-widest">No Active Targets</p>
                <p className="text-xs text-text-muted mt-1">Set a study plan to see targets</p>
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
                <span className="text-xs font-black uppercase tracking-widest text-primary">Next Milestone</span>
            </div>
            <h4 className="text-sm font-black text-text-primary truncate mb-1">
                {deadline.courseTitle}
            </h4>
            <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-black ${isUrgent ? 'text-danger' : 'text-text-secondary'}`}>
                    {deadline.daysLeft} Days Left
                </span>
                <span className="text-xs font-black text-text-primary">{deadline.progress}%</span>
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
                            <img src="/whatsapp-icon.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
                            WhatsApp
                        </a>
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-xs font-black text-primary uppercase tracking-widest mb-2">
                            <span>Direct Link</span>
                            <span className="text-success">Ready</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-surface-3 rounded-lg border border-border text-xs font-mono text-text-primary truncate">
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
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-success/10 border border-success/20 overflow-hidden">
                    <img src="/Mastery level.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-primary">Mastery Level</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1 overflow-hidden">
                <span className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight truncate">{completionRate}%</span>
                <span className="text-sm font-black text-text-secondary">Global</span>
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

    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/courses/${course._id}`);
    };

    return (
        <>
        <ShareModal 
            isOpen={isShareModalOpen} 
            onClose={() => setIsShareModalOpen(false)} 
            courseTitle={course.title}
            shareUrl={`${window.location.origin}/share/${course._id}`}
        />
        <div 
            onClick={handleCardClick}
            className="glass-card group block transition-all cursor-pointer" 
            style={{ padding: 0, overflow: 'hidden' }}
        >
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
                <div className="flex items-center justify-between text-xs font-black text-text-secondary uppercase tracking-tight">
                    <span>{course.totalLectures} missions</span>
                    <span className="text-primary">{pct}% complete</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                    {resumeId && (
                        <div className="text-xs font-semibold text-primary">
                            <span className="flex items-center gap-1 hover:underline">
                                Resume Mission <ChevronRight className="w-3 h-3" />
                            </span>
                        </div>
                    )}
                    <Link 
                        to={`/roadmap?courseId=${course._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors"
                    >
                        <Layout className="w-3.5 h-3.5" /> Roadmap
                    </Link>
                </div>
            </div>
        </div>
        </>
    );
}

/* ── Dashboard ──────────────────────────────────────────────────────── */
const Dashboard = () => {
    const { user: authUser } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const isDemo = searchParams.get('demo') === 'true';

    // Mock user for demo mode
    const user = authUser || (isDemo ? { 
        name: 'Guest Explorer', 
        role: 'guest', 
        level: 1, 
        usernameSet: true,
        guest: true 
    } : null);

    const { totalXP, level, levelTitle, streak, xpProgress, xpToNextLevel, setProfile, addBadgeToast } = useGamificationStore();
    const queryClient = useQueryClient();

    const [showCreate, setShowCreate] = useState(false);
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showXPSystem, setShowXPSystem] = useState(false);
    const [roadmapCourseId, setRoadmapCourseId] = useState(null);
    const [optimisticHiddenIds, setOptimisticHiddenIds] = useState(new Set());
    const [showUndo, setShowUndo] = useState(null); // { id, title, timer }
    const [undoCountdown, setUndoCountdown] = useState(0);
    const [activeTab, setActiveTab] = useState('courses');

    // Features list (top 5)
    const newFeatures = [
        {
            id: 'seo-engine',
            title: 'Search Engine Visibility',
            description: 'QuestXP is now discoverable! Optimized meta-engines, dynamic sitemaps, and indexing protocols for top Google ranking.',
            icon: <Search className="w-5 h-5 text-primary" />,
            date: 'Latest'
        },
        {
            id: 'india-geo-block',
            title: 'India-Only Security Guard',
            description: 'New regional firewall active. QuestXP is now restricted to Indian IP addresses to eliminate unauthorized foreign access attempts.',
            icon: <Shield className="w-5 h-5 text-warning" />,
            date: 'New'
        },
        {
            id: 'valkey-infra',
            title: 'High-Speed Valkey Infra',
            description: 'Upgraded background processing engine to Valkey. Zero request-throttling and ultra-low latency for AI pipelines.',
            icon: <Zap className="w-5 h-5 text-primary" />,
            date: 'Speed'
        },
        {
            id: 'streak-capture',
            title: 'Achievement Capture 2.0',
            description: 'Share your progress in style! New high-fidelity achievement cards with backdrop-blur and premium TUF-inspired aesthetics.',
            icon: <Camera className="w-5 h-5 text-secondary" />,
            date: 'Major'
        },
        {
            id: 'video-support',
            title: 'AI Video Chapterization',
            description: 'Full support for single long-form "One-Shot" videos. Paste any tutorial and we\'ll split it into logical missions.',
            icon: <PlayCircle className="w-5 h-5 text-success" />,
            date: 'Popular'
        }
    ];

    useEffect(() => {
        const hasSeenSEO = localStorage.getItem('seen_feature_seo_v1');
        if (!hasSeenSEO) {
            toast.success("SEO Upgrade: QuestXP is now optimized for Google Search! 🔍🚀", {
                duration: 6000,
                icon: '🔍'
            });
            localStorage.setItem('seen_feature_seo_v1', 'true');
        }

        const hasSeenGeoBlock = localStorage.getItem('seen_feature_geoblock_v1');
        if (!hasSeenGeoBlock) {
            toast.success("Security Update: India-Only access is now enforced! 🛡️🇮🇳", {
                duration: 7000,
                icon: '🛡️'
            });
            localStorage.setItem('seen_feature_geoblock_v1', 'true');
        }

        const hasSeenVideoSupport = localStorage.getItem('seen_feature_video_support_v1');
        if (!hasSeenVideoSupport) {
            setTimeout(() => {
                toast.success("New: 10hr+ One-Shot Video Support is LIVE! 🚀", {
                    duration: 6000,
                    icon: '📺'
                });
                localStorage.setItem('seen_feature_video_support_v1', 'true');
            }, 3000);
        }

    }, []);

    useEffect(() => {
        if (localStorage.getItem('justSignedUp') === 'true') {
            shootFireworks();
            localStorage.removeItem('justSignedUp');
        }
        
        // Feature Announcements
        const seenFeatures = JSON.parse(localStorage.getItem('seenFeatures') || '[]');
        
        if (!seenFeatures.includes('streak_capture_v1')) {
            setTimeout(() => {
                addBadgeToast('New: Achievement Capture!', 'Share your streaks with premium, high-fidelity export cards!', 'camera');
                seenFeatures.push('streak_capture_v1');
                localStorage.setItem('seenFeatures', JSON.stringify(seenFeatures));
            }, 3000);
        }

        if (!seenFeatures.includes('one_shot_videos')) {
            setTimeout(() => {
                addBadgeToast('New: One-Shot Support!', 'Create courses from single long videos now!', 'video');
                seenFeatures.push('one_shot_videos');
                localStorage.setItem('seenFeatures', JSON.stringify(seenFeatures));
            }, 7000);
        }

        if (!seenFeatures.includes('bulk_completion_v1')) {
            setTimeout(() => {
                addBadgeToast('New: Bulk Completion!', 'Level up faster! Mark entire courses as done in one click.', 'check');
                seenFeatures.push('bulk_completion_v1');
                localStorage.setItem('seenFeatures', JSON.stringify(seenFeatures));
            }, 12000);
        }
    }, [addBadgeToast]);

    useEffect(() => {
        if (user && !user.usernameSet) {
            setShowUsernameModal(true);
        }
    }, [user]);


    useEffect(() => {
        const handleOpenLeaderboard = () => setShowLeaderboard(true);
        window.addEventListener('open-leaderboard', handleOpenLeaderboard);

        // BI-DIRECTIONAL SYNC: Refresh on window focus to catch updates from other tabs (Roadmap, Player)
        let lastFocusFetch = Date.now();
        const handleFocus = () => {
            if (Date.now() - lastFocusFetch > 5000) {
                queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['progress'] });
                queryClient.invalidateQueries({ queryKey: ['courses'] });
                lastFocusFetch = Date.now();
            }
        };
        window.addEventListener('focus', handleFocus);

        const handleProgressSync = () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['progress'] });
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['xpHistory'] });
        };
        window.addEventListener('questxp_progress_updated', handleProgressSync);

        const handleStorageSync = (e) => {
            if (e.key === 'questxp_progress_sync') {
                handleProgressSync();
            }
        };
        window.addEventListener('storage', handleStorageSync);

        return () => {
            window.removeEventListener('open-leaderboard', handleOpenLeaderboard);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('questxp_progress_updated', handleProgressSync);
            window.removeEventListener('storage', handleStorageSync);
        };
    }, [queryClient]);

    useEffect(() => {
        if (searchParams.get('open') === 'leaderboard') {
            setShowLeaderboard(true);
            // Clear 'open' param while preserving others (like 'demo')
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('open');
            setSearchParams(nextParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stats');
            return data;
        },
        enabled: !!user && !user.guest
    });

    const { data: leaderboardData = [] } = useQuery({
        queryKey: ['global-leaderboard'],
        queryFn: async () => {
            const { data } = await api.get('/gamification/leaderboard');
            return data;
        },
        enabled: !!user && !user.guest
    });
    const [visibleCount, setVisibleCount] = useState(6);

    // ── Queries ──────────────────────────────────────────────────────────

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const data = await getGamificationProfile();
            setProfile(data);
            return data;
        },
        enabled: !!user && !user.guest
    });

    const { data: historyData = [] } = useQuery({
        queryKey: ['xpHistory'],
        queryFn: getXPHistory,
        enabled: !!user && !user.guest
    });

    const { data: coursesData, isLoading: coursesLoading } = useQuery({
        queryKey: ['courses', user?.guest],
        queryFn: async () => {
            if (user?.guest) {
                const local = localStorage.getItem('questxp_demo_course');
                return local ? [JSON.parse(local)] : [];
            }
            const { data } = await api.get('/courses');
            return data.courses || [];
        },
        refetchInterval: (data) => {
            if (user?.guest) return false;
            const hasProcessing = data?.state?.data?.some(c => c.status === 'processing');
            return hasProcessing ? 3000 : false;
        }
    });

    const { data: progressMap = {}, isLoading: progressLoading } = useQuery({
        queryKey: ['progress', user?.guest, coursesData?.map(c => c._id).join('|') || 'none'],
        queryFn: async () => {
            const courses = coursesData || [];
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

    const isGuest = user.guest;

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
                                    <span className="text-xs text-text-muted">{activePct > 0 ? `
                                    ${activePct}% complete` : 'Ready to begin'}</span>
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-4">
                                    <h2 onClick={() => setActiveTab('courses')} className={`text-xl font-bold tracking-tight uppercase cursor-pointer ${activeTab === 'courses' ? 'text-text-primary' : 'text-text-muted'}`}>Dashboard</h2>
                                    <h2 onClick={() => setActiveTab('features')} className={`text-xl font-bold tracking-tight uppercase cursor-pointer ${activeTab === 'features' ? 'text-text-primary' : 'text-text-muted'}`}>New Features</h2>
                                </div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    {activeTab === 'courses' ? 'Monitor your active learning missions' : 'Latest updates to the QuestXP platform'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button id="tour-new-course" onClick={() => setShowCreate(v => !v)} className="btn-primary py-2.5 px-5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 flex-1 sm:flex-none justify-center">
                                    {showCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                    {showCreate ? 'Cancel' : 'New Mission'}
                                </button>
                                {user.role === 'admin' && (
                                    <Link 
                                        to="/admin/feedback" 
                                        className="px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-colors flex items-center gap-2"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Feedback
                                    </Link>
                                )}
                            </div>
                        </div>
                        {activeTab === 'courses' ? (
                            <>
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
                                        <p className="text-sm mb-6 text-text-secondary">
                                            {isGuest 
                                                ? "Try creating your first course to see how it works!" 
                                                : "Paste a YouTube playlist to generate your first course."}
                                        </p>
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
                                                    Load More Missions
                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="glass-card overflow-hidden border-primary/20">
                                    <div className="bg-primary/10 p-6 border-b border-primary/20">
                                        <h3 className="text-lg font-bold text-text-primary">What's New</h3>
                                        <p className="text-sm text-text-secondary mt-1">Stay updated with the latest QuestXP enhancements.</p>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {newFeatures.map((feature) => (
                                            <div key={feature.id} className="p-6 hover:bg-surface-2 transition-colors group">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-xl bg-surface border border-border group-hover:border-primary/30 transition-all">
                                                        {feature.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">{feature.title}</h4>
                                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter">
                                                                {feature.date}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary leading-relaxed">
                                                            {feature.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-card p-8 text-center bg-gradient-to-br from-primary/5 to-transparent">
                                    <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
                                    <h3 className="text-xl font-black text-text-primary uppercase mb-2">More coming soon</h3>
                                    <p className="text-sm text-text-secondary max-w-md mx-auto">
                                        We are constantly evolving to make your learning journey more epic. Have a suggestion? Let us know!
                                    </p>
                                </div>
                            </div>
                        )}


                    </section>
                </div>

                <aside className="flex flex-col w-full xl:w-72 shrink-0 space-y-4">
                    <div id="tour-mission">
                        <DailyMissionWidget />
                    </div>
                    {!isGuest && (
                        <>
                            <div className="glass-card block transition-all p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={(e) => {
                                                console.log('[DEBUG] XP Info Clicked', { event: e });
                                                setShowXPSystem(true);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-all border border-white/30 shadow-sm pointer-events-auto cursor-pointer"
                                            style={{ position: 'relative', zIndex: 50 }}
                                            title="How XP works"
                                        >
                                            <Info className="w-4 h-4" />
                                        </button>
                                        <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center font-bold text-sm bg-primary text-white shadow-lg shadow-primary/20">
                                            {user.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">{user.name}</p>
                                            <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{levelTitle || 'Explorer'} · Lvl {level}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="progress-bar mb-1.5 h-1.5">
                                    <div className="progress-bar__fill bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" style={{ width: `${xpProgress}%` }} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">
                                        {user?.xp || 0} XP
                                    </p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">
                                        {xpToNextLevel} to Lvl {level + 1}
                                    </p>
                                </div>
                            </div>

                            <div className="glass-card p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                                    <h2 className="text-sm font-black tracking-widest text-text-primary uppercase">Hidden Quests</h2>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 rounded-xl border border-primary/10 bg-primary/5 flex items-center gap-3 group hover:border-primary/30 transition-all cursor-default">
                                        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-text-primary uppercase tracking-wider">Deep Focus</p>
                                            <p className="text-[10px] text-text-secondary">Study 1hr today (+50 XP)</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-primary/10 bg-primary/5 flex items-center gap-3 group hover:border-primary/30 transition-all cursor-default">
                                        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-text-primary uppercase tracking-wider">Hyper Learner</p>
                                            <p className="text-[10px] text-text-secondary">Study 3hr today (+200 XP)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Flame className="w-4 h-4 text-warning" />
                            <h2 className="text-sm font-semibold tracking-wide text-text-primary">Study Streak</h2>
                        </div>
                        <StreakCalendar history={historyData} rank={stats?.rank?.current} />
                    </div>


                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4 text-success" />
                            <h2 className="text-sm font-semibold tracking-wide text-text-primary">Daily Quests</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2 hover:border-success/50 transition-colors cursor-pointer group gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-text-primary group-hover:text-success transition-colors truncate">Study for 15 minutes</p>
                                    <p className="text-xs text-text-secondary mt-0.5">Gain 50 XP</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:bg-success/10 group-hover:border-success/30 transition-colors p-1.5">
                                    <img src="/favicon.png" alt="" className="w-full h-full object-contain" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2 hover:border-success/50 transition-colors cursor-pointer group gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-text-primary group-hover:text-success transition-colors truncate">Complete a Quiz</p>
                                    <p className="text-xs text-text-secondary mt-0.5">Gain 100 XP</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:bg-success/10 group-hover:border-success/30 transition-colors p-1.5">
                                    <img src="/favicon.png" alt="" className="w-full h-full object-contain" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {isDemo && (
                        <div className="glass-card p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Crown className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-sm font-bold text-text-primary mb-2 uppercase tracking-widest">Premium Features</h3>
                            <p className="text-xs text-text-secondary leading-relaxed mb-6">
                                Sign in to unlock AI Roadmaps, Progress Tracking, Daily Missions, and the Global Leaderboard.
                            </p>
                            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 text-xs uppercase tracking-widest font-black text-center rounded-lg">
                                Create Account
                            </Link>
                        </div>
                    )}


                </aside>
            </div>

            <Footer onOpenFeedback={() => setFeedbackOpen(true)} />
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} contextPage="Dashboard" />
            <UsernameModal isOpen={showUsernameModal} onClose={() => setShowUsernameModal(false)} />
            <GlobalLeaderboardModal 
                isOpen={showLeaderboard} 
                onClose={() => setShowLeaderboard(false)} 
                players={leaderboardData} 
                onShowXPSystem={() => setShowXPSystem(true)}
                />
            {roadmapCourseId && (
                <GenerateRoadmapModal 
                    isOpen={!!roadmapCourseId} 
                    onClose={() => setRoadmapCourseId(null)} 
                    courseId={roadmapCourseId} 
                    />
            )}
            <XPSystemModal isOpen={showXPSystem} onClose={() => setShowXPSystem(false)} />
            {!showUsernameModal && <UserTour />}

            {/* Undo Toast */}
            <AnimatePresence>
                {showUndo && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-5 px-6 py-4 bg-surface-2 border-2 border-border rounded-2xl shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary text-primary font-black text-lg animate-pulse">
                            {undoCountdown}
                        </div>
                        <div className="flex flex-col min-w-[120px]">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Course Deleting</span>
                            <span className="text-sm font-black text-text-primary line-clamp-1">{showUndo.title}</span>
                        </div>
                        <button 
                            onClick={handleUndoDelete}
                            className="ml-2 px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            Undo
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

    );
};

const XPSystemModal = ({ isOpen, onClose }) => {
    const mechanics = [
        { title: "Progressive Lectures", desc: "Gain more XP as you go. Lecture 1 (+50 XP), Lecture 2 (+60 XP), and so on!", icon: <BookOpen className="w-5 h-5" />, color: "text-blue-400" },
        { title: "Study Streaks", desc: "Keep the flame alive! 1.25x (7 days), 1.5x (14 days), 2x (30 days), up to 3x multiplier!", icon: <Flame className="w-5 h-5" />, color: "text-warning" },
        { title: "Daily Goals", desc: "Hit your study goal for +50 XP bonus every single day.", icon: <Target className="w-5 h-5" />, color: "text-success" },
        { title: "Deep Focus", desc: "Secret bonuses for long sessions: 1hr (+50 XP) and 3hrs (+200 XP)!", icon: <Zap className="w-5 h-5" />, color: "text-primary" },
        { title: "Quiz Mastery", desc: "Ace a quiz for +75 XP. Improve your previous score for extra gains.", icon: <Trophy className="w-5 h-5" />, color: "text-purple-400" },
    ];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-surface border border-white/10 rounded-[2rem] shadow-2xl p-8 overflow-y-auto max-h-[90vh] scrollbar-hide z-10 pointer-events-auto"
                    >
                        <div className="absolute top-0 right-0 p-6">
                            <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-text-muted hover:text-white" />
                            </button>
                        </div>

                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                                <Zap className="w-3 h-3" />
                                Leveling System
                            </div>
                            <h2 className="text-3xl font-black text-text-primary uppercase tracking-tight">How XP Works</h2>
                            <p className="text-text-secondary mt-2">Master the system to evolve your rank faster.</p>
                        </div>

                        <div className="space-y-4">
                            {mechanics.map((m, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-surface-2 border border-border hover:border-primary/30 transition-all group">
                                    <div className={`shrink-0 w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center ${m.color} group-hover:scale-110 transition-transform`}>
                                        {m.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-primary uppercase tracking-wide">{m.title}</h4>
                                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{m.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-border">
                            <button 
                                onClick={onClose}
                                className="w-full btn-primary py-4 text-xs font-black uppercase tracking-[0.2em]"
                            >
                                Got it, Captain
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Dashboard;
