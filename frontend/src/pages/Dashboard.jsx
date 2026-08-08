import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Flame, Trophy, Plus, ChevronRight, Trash2, Target, MessageSquare, Share2, Copy, Layout, Sparkles, Clock, Info, X, Users, BookOpen, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import api from '../services/api';
import { getGamificationProfile, getXPHistory } from '../services/gamificationApi';
import NavBar from '../components/NavBar';
import useFocusTrap from '../hooks/useFocusTrap';
import DailyMissionWidget from '../components/Dashboard/DailyMissionWidget';
import UserTour from '../components/Dashboard/UserTour';

import StreakCalendar from '../components/StreakCalendar';
import CourseCreationForm from '../components/Course/CourseCreationForm';
import { shootFireworks, shootConfetti } from '../utils/confetti';
import FeedbackModal from '../components/FeedbackModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseCardSkeleton } from '../components/ui/Skeleton';
import Footer from '../components/ui/Footer';
import UsernameModal from '../components/Dashboard/UsernameModal';
import { Calendar, Crown, Smartphone } from 'lucide-react';
import GlobalLeaderboardModal from '../components/Dashboard/GlobalLeaderboardModal';
import GenerateRoadmapModal from '../components/Roadmap/GenerateRoadmapModal';
import { ShinyCard } from '../components/ui/ShinyCard';
import ProgressAnimata from '../components/ui/ProgressAnimata';


/* ── Helpers ─────────────────────────────────────────────────────────── */
const XP_PER_LECTURE = 50;

function calcCourseProgress(course, progress) {
    const total = course?.totalLectures || 1;
    const done = progress?.completedLectures?.length || 0;
    return Math.round((done / total) * 100);
}



/* ── Share Modal ─────────────────────────────────────────────────────── */
function ShareModal({ isOpen, onClose, courseTitle, shareUrl }) {
    const trapRef = useFocusTrap(isOpen, onClose);
    if (!isOpen) return null;

    const shareText = `*I found this awesome course "${courseTitle}" on QuestXP!* 🚀\n\nWould you like to level up? Check it out here:\n${shareUrl}`;

    const copyMessage = () => {
        navigator.clipboard.writeText(shareText);
        toast.success('Copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" onClick={onClose} />
            <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Share course" className="relative w-full max-w-md clay rounded-clay-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary">
                        <Share2 className="w-5 h-5" />
                        <span className="font-display font-bold text-base">Share quest</span>
                    </div>
                    <button onClick={onClose} className="clay-sm clay-interactive w-10 h-10 flex items-center justify-center rounded-clay" aria-label="Close">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>
                <div className="px-6 pb-6 space-y-4">
                    <div className="clay-sunk p-4 rounded-clay text-sm text-text-secondary leading-relaxed">
                        "{shareText}"
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={copyMessage}
                            className="btn-primary text-sm"
                        >
                            <Copy className="w-4 h-4" />
                            Copy
                        </button>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="clay-sm clay-interactive flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-clay text-sm font-bold text-text-primary"
                        >
                            <img src="/whatsapp-icon.png" alt="" className="w-5 h-5 object-contain" />
                            WhatsApp
                        </a>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                            <span>Direct link</span>
                            <span className="text-success">Ready</span>
                        </div>
                        <div className="clay-sunk-sm flex items-center gap-2 p-3 rounded-clay text-xs font-mono text-text-primary truncate">
                            {shareUrl}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Course Card ────────────────────────────────────────────────────── */
function CourseCard({ course, progress, onDelete, isDeleting, priority = false }) {
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

    const handleShare = (R_e) => {
        R_e.preventDefault();
        R_e.stopPropagation();
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
        <ShinyCard
            className="clay clay-interactive rounded-clay-lg group block cursor-pointer w-full h-full overflow-hidden"
            style={{ padding: 0 }}
            onClick={handleCardClick}
        >
                <div className="relative w-full aspect-video overflow-hidden rounded-clay m-2 mb-0 w-[calc(100%-1rem)]">
                    {thumb ? (
                        <img
                            src={thumb}
                            alt={course.title}
                            loading={priority ? undefined : "lazy"}
                            fetchPriority={priority ? "high" : "auto"}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center clay-sunk">
                            <BookOpen className="w-10 h-10 text-text-muted" />
                        </div>
                    )}

                    <div className="absolute top-2 right-2 xp-chip !bg-surface/90 backdrop-blur-sm">
                        +{xpPool} XP
                    </div>
                    <button
                        type="button"
                        className="absolute top-2 left-2 inline-flex items-center justify-center gap-1 rounded-clay bg-surface/90 backdrop-blur-sm w-9 h-9 text-danger transition-all hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(course);
                        }}
                        disabled={isDeleting}
                        aria-label={`Delete ${course.title}`}
                        title={isDeleting ? 'Deleting...' : 'Delete course permanently'}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="absolute top-2 left-[3.25rem] inline-flex items-center justify-center gap-1 rounded-clay bg-surface/90 backdrop-blur-sm h-9 px-2.5 text-xs font-bold text-text-primary transition-all hover:bg-primary hover:text-white"
                        onClick={handleShare}
                        aria-label={`Share ${course.title}`}
                        title="Copy share link"
                    >
                        <Share2 className="w-4 h-4" />
                        {shareStatus && <span>{shareStatus}</span>}
                    </button>
                </div>

                <div className="p-4">
                    <h3 className="font-display font-bold text-text-primary text-base leading-tight mb-1.5 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                    <div className="mb-3 text-xs font-semibold text-text-muted flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {course.createdAt ? new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                    </div>
                    <div className="mb-3">
                        <ProgressAnimata progress={pct} />
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                        <span className="font-mono">{course.totalLectures} missions</span>
                        <span className="font-mono text-primary">{pct}% complete</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                        {resumeId && (
                            <span className="flex items-center gap-1 text-sm font-bold text-primary group-hover:gap-2 transition-all">
                                Resume <ChevronRight className="w-4 h-4" />
                            </span>
                        )}
                        <Link
                            to={`/roadmap?courseId=${course._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-primary transition-colors"
                        >
                            <Layout className="w-3.5 h-3.5" /> Roadmap
                        </Link>
                    </div>
                </div>
        </ShinyCard>
        </>
    );
}

/* ── Dashboard ──────────────────────────────────────────────────────── */
const Dashboard = () => {
    const { user: authUser, isDemoMode } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isDemo = isDemoMode;

    // Mock user for demo mode
    const user = useMemo(() => authUser || (isDemo ? { 
        name: 'Guest Explorer', 
        role: 'guest', 
        level: 1, 
        usernameSet: true,
        guest: true 
    } : null), [authUser, isDemo]);

    const { level, levelTitle, xpProgress, xpToNextLevel, totalXP, setProfile } = useGamificationStore();
    const queryClient = useQueryClient();

    const [showCreate, setShowCreate] = useState(false);
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showXPSystem, setShowXPSystem] = useState(false);
    const [showStreakCalendar, setShowStreakCalendar] = useState(false);
    const [roadmapCourseId, setRoadmapCourseId] = useState(null);
    const [optimisticHiddenIds, setOptimisticHiddenIds] = useState(new Set());
    const [showUndo, setShowUndo] = useState(null); // { id, title, timer }
    const [undoCountdown, setUndoCountdown] = useState(0);
    const [activeTab, setActiveTab] = useState('courses');

    const newFeatures = useMemo(() => [
        {
            id: 'mobile-player-v1',
            title: 'Mobile Player & Doubt Bot',
            description: 'Study on the go! A brand new native-feeling edge-to-edge mobile player layout with the AI Doubt Tutor integrated directly inside the sidebar tabs.',
            icon: <Smartphone className="w-5 h-5 text-primary" />,
            date: 'New',
            toast: {
                msg: "New: Edge-to-edge Mobile Player & AI Doubt Bot sidebar tab is LIVE! 📱",
                icon: '📱'
            }
        },
        {
            id: 'granular-roadmap-v2',
            title: 'Granular Roadmap Control',
            description: 'Total control over your study plan. Select specific sections or individual videos to generate a roadmap tailored exactly to what you need to learn.',
            icon: <Sparkles className="w-5 h-5 text-primary" />,
            date: 'New',
            toast: {
                msg: "New: Granular Roadmap Control! Select individual videos for your plan. 🎯",
                icon: '🎯'
            }
        },
        {
            id: 'one-shot-videos-v1',
            title: 'One-Shot Video Support',
            description: 'Now supporting 10hr+ marathon lectures. Create full study roadmaps from a single long video with ease.',
            icon: <Plus className="w-5 h-5 text-primary" />,
            date: 'New',
            toast: {
                msg: "New: 10hr+ One-Shot Video Support is LIVE! 🚀",
                icon: '📺'
            }
        },
        {
            id: 'ai-timestamps-v1',
            title: 'AI Timestamp Engine',
            description: 'Tutorial has no chapters? Our AI automatically generates timestamps to break long chapter-less videos into logical, bite-sized study missions.',
            icon: <Clock className="w-5 h-5 text-primary" />,
            date: 'New',
            toast: {
                msg: "New: AI-Generated Timestamps for chapter-less videos! ⏱️",
                icon: '⏱️'
            }
        },
        {
            id: 'friend-zones-v1',
            title: 'Friend Zones',
            description: 'Create a private squad with a 6-digit join code. Compete with friends on a shared XP leaderboard and watch each other\'s activity feed in real time.',
            icon: <Users className="w-5 h-5 text-primary" />,
            date: 'New',
            toast: {
                custom: (t, nav) => (
                    <span className="flex items-center gap-3">
                        <span className="text-xs sm:text-sm">
                            <strong>New:</strong> Friend Zones — squad up & compete privately
                        </span>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                nav('/friendzones');
                            }}
                            className="px-2 py-1 rounded-md bg-primary text-bg text-[10px] font-bold"
                        >
                            Open
                        </button>
                    </span>
                ),
                icon: '👥'
            }
        }
    ], []);

    useEffect(() => {
        // POPUP LOGIC: Only fire top 3 unread features
        let popped = 0;
        newFeatures.forEach((feat) => {
            if (popped >= 3) return;
            const key = `seen_feature_${feat.id}`;
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, 'true'); 
                setTimeout(() => {
                    if (feat.toast.custom) {
                        toast((t) => feat.toast.custom(t, navigate), { duration: 9000, icon: feat.toast.icon });
                    } else {
                        toast.success(feat.toast.msg, { duration: 6000, icon: feat.toast.icon });
                    }
                }, 1500 * (popped + 1));
                popped++;
            }
        });

        // Background / Security Announcements (Legacy or silent check)
        const hasSeenSEO = localStorage.getItem('seen_feature_seo_v1');
        if (!hasSeenSEO) localStorage.setItem('seen_feature_seo_v1', 'true');
        
        const hasSeenGeoBlock = localStorage.getItem('seen_feature_geoblock_v1');
        if (!hasSeenGeoBlock) localStorage.setItem('seen_feature_geoblock_v1', 'true');

        // Fireworks for sign-up
        if (localStorage.getItem('justSignedUp') === 'true') {
            shootFireworks();
            localStorage.removeItem('justSignedUp');
        }

        // Confetti for login
        if (localStorage.getItem('justLoggedIn') === 'true') {
            shootConfetti();
            localStorage.removeItem('justLoggedIn');
        }
    }, [navigate, newFeatures]);

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
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('open');
            setSearchParams(nextParams, { replace: true });
        }
        
        if (searchParams.get('createUrl')) {
            setShowCreate(true);
            // We keep createUrl in the URL so CourseCreationForm can read it, or we could pass it from state.
            // Let's keep it in searchParams and pass it down.
        }
    }, [searchParams, setSearchParams]);

    const { data: stats } = useQuery({
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

    useQuery({
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
    const { data: coursesData = [], isLoading: coursesLoading } = useQuery({
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



    const { data: progressMap = {} } = useQuery({
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
        onError: (err, courseId) => {
            setDeleteError(err.response?.data?.error || 'Failed to delete course.');
            // The delete didn't happen, so put the card back rather than
            // leaving a ghost gap until the next reload.
            setOptimisticHiddenIds(prev => {
                const next = new Set(prev);
                next.delete(courseId);
                return next;
            });
        }
    });

    // Every delete waiting out its undo window, keyed by course id. This has to
    // be a ref, not state: the unload handler below reads it during teardown,
    // when a stale closure over state would see an empty map.
    const pendingDeletesRef = useRef(new Map());

    // A deferred delete lives in a setTimeout, so refreshing inside the undo
    // window used to destroy the timer before the request ever left the
    // browser — the server never heard about it and the course came back on
    // reload. Flush anything still pending with `keepalive`, which the browser
    // is obliged to finish even as the page goes away.
    useEffect(() => {
        const pending = pendingDeletesRef.current;

        const flush = () => {
            const token = (() => {
                try { return localStorage.getItem('accessToken'); } catch { return null; }
            })();

            for (const [courseId, entry] of pending) {
                clearTimeout(entry.timer);
                clearInterval(entry.interval);
                // Plain fetch rather than the axios instance: axios can't opt
                // into keepalive, and this request has to outlive the page.
                fetch(`${api.defaults.baseURL}/courses/${courseId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    keepalive: true,
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }).catch(() => { /* page is going away; nothing to report to */ });
            }
            pending.clear();
        };

        window.addEventListener('pagehide', flush);
        return () => {
            window.removeEventListener('pagehide', flush);
            // Leaving the dashboard commits too — the user asked for the
            // delete and then navigated on, so honour it.
            flush();
        };
    }, []);

    const handleDeleteCourse = async (course) => {
        // Optimistic UI Removal
        setOptimisticHiddenIds(prev => new Set(prev).add(course._id));
        setUndoCountdown(5);

        const timer = setTimeout(() => {
            pendingDeletesRef.current.delete(course._id);
            clearInterval(interval);
            deleteMutation.mutate(course._id, {
                onSettled: () => {
                    setDeletingCourseId(null);
                    setShowUndo(prev => (prev?.id === course._id ? null : prev));
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

        // Deleting a second course no longer cancels the first one's pending
        // request — each waits out its own window independently.
        pendingDeletesRef.current.set(course._id, { timer, interval });
        setShowUndo({ id: course._id, title: course.title });
        setDeletingCourseId(course._id);
    };

    const handleUndoDelete = () => {
        if (!showUndo) return;
        const entry = pendingDeletesRef.current.get(showUndo.id);
        if (entry) {
            clearTimeout(entry.timer);
            clearInterval(entry.interval);
            pendingDeletesRef.current.delete(showUndo.id);
        }

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
        <div className="min-h-screen bg-bg text-text-primary relative">
            <NavBar />

            <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 py-5 space-y-5 relative z-10">

                {/* ── 1. Who you are, where you are ─────────────────────────
                    One line of identity and level progress, so the sidebar
                    no longer has to carry it above the day's work.        */}
                <section className="clay rounded-clay-lg p-5 flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-14 h-14 shrink-0 rounded-clay flex items-center justify-center text-white font-display font-bold text-xl clay-pop-sm"
                             style={{ background: 'linear-gradient(150deg, var(--color-primary), var(--color-primary-hover))' }}>
                            {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary truncate">
                                {(() => {
                                    const h = new Date().getHours();
                                    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
                                })()}, {user.name?.split(' ')[0]}
                            </h1>
                            <p className="text-sm font-semibold text-text-secondary truncate flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-gold shrink-0" />
                                {levelTitle || 'Explorer'} · Level {level}
                                {!isGuest && <> · <span className="font-mono">{Number(totalXP || user?.xp || 0).toLocaleString()} XP</span></>}
                            </p>
                        </div>
                    </div>

                    {!isGuest && (
                        <button
                            onClick={() => setShowStreakCalendar(true)}
                            className="clay-sm clay-interactive shrink-0 flex items-center gap-3 pl-2.5 pr-4 h-14 rounded-clay hover:-translate-y-[1px] transition-all duration-200 ease-clay"
                            title="Open streak calendar"
                        >
                            <div className="clay-sunk w-9 h-9 rounded-clay flex items-center justify-center text-warning shrink-0">
                                <Flame className="w-4.5 h-4.5" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Streak
                                </p>
                                <p className="font-mono font-bold text-text-primary text-sm leading-tight">{user?.streak?.current || 0} days</p>
                            </div>
                        </button>
                    )}

                    {!isGuest && (
                        <div className="w-full sm:w-64 shrink-0">
                            <div className="flex items-center justify-between mb-2 text-xs font-bold text-text-muted">
                                <span className="uppercase tracking-widest">Level {level}</span>
                                <span className="font-mono">{xpToNextLevel} to Lvl {level + 1}</span>
                            </div>
                            <div className="progress-bar h-3">
                                <div className="progress-bar__fill" style={{ width: `${xpProgress}%` }} />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setShowXPSystem(true)}
                        className="clay-sm clay-interactive shrink-0 w-11 h-11 flex items-center justify-center rounded-clay text-text-secondary hover:text-primary"
                        title="How XP works"
                        aria-label="How XP works"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                </section>

                {/* ── 2. Today — the only decision that matters right now ── */}
                <section className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 items-stretch">
                    {activeCourse ? (
                        <Link
                            id="tour-hero"
                            to={firstLecId ? `/courses/${activeCourse._id}/lectures/${firstLecId}` : `/courses/${activeCourse._id}`}
                            className="clay clay-interactive rounded-clay-lg p-5 flex flex-col sm:flex-row gap-5 sm:items-center group"
                        >
                            {activeCourse.sections?.[0]?.lectures?.[0]?.thumbnailUrl && (
                                <img
                                    src={activeCourse.sections[0].lectures[0].thumbnailUrl}
                                    alt=""
                                    className="w-full sm:w-40 h-32 sm:h-24 object-cover rounded-clay shrink-0 clay-pop-sm"
                                />
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase tracking-widest mb-1.5 text-primary">Continue studying</p>
                                <h2 className="text-lg sm:text-xl font-display font-bold text-text-primary mb-2 leading-tight group-hover:text-primary transition-colors truncate">
                                    {activeCourse.title}
                                </h2>
                                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                    <span className="xp-chip">
                                        {Math.floor(activePct * (activeCourse.totalLectures * XP_PER_LECTURE) / 100).toLocaleString()} / {(activeCourse.totalLectures * XP_PER_LECTURE).toLocaleString()} XP
                                    </span>
                                    <span className="text-xs font-semibold text-text-muted">
                                        {activePct > 0 ? `${activePct}% complete` : 'Ready to begin'}
                                    </span>
                                </div>
                                <div className="max-w-[240px]">
                                    <ProgressAnimata progress={activePct} />
                                </div>
                            </div>

                            <div className="btn-primary shrink-0 self-start sm:self-center">
                                Resume
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </Link>
                    ) : (
                        <div className="clay rounded-clay-lg p-8 flex flex-col items-center justify-center text-center gap-3">
                            <div className="clay-sunk w-14 h-14 rounded-clay flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-text-muted" />
                            </div>
                            <h2 className="text-lg font-display font-bold text-text-primary">Nothing in progress</h2>
                            <p className="text-sm text-text-secondary max-w-sm">
                                Paste a YouTube playlist below and QuestXP turns it into a course with quizzes and a schedule.
                            </p>
                            <button onClick={() => setShowCreate(true)} className="btn-primary mt-1">
                                <Plus className="w-4 h-4" /> Create your first course
                            </button>
                        </div>
                    )}

                    <div id="tour-mission" className="min-w-0">
                        <DailyMissionWidget />
                    </div>
                </section>

                {/* ── 3. Earn XP — low-key, folded in rather than two big
                    quest cards competing with the target above.        */}
                {!isGuest && (
                    <section id="tour-stats" className="clay-sunk rounded-clay-lg px-4 py-3 flex items-center gap-2.5 overflow-x-auto">
                        <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                            <Zap className="w-3.5 h-3.5 text-primary" /> Earn XP
                        </span>
                        {[
                            { title: 'Study 15 min', xp: 50, icon: Clock },
                            { title: 'Complete a quiz', xp: 100, icon: Trophy },
                            { title: 'Deep focus · 1hr', xp: 50, icon: Zap },
                            { title: 'Hyper learner · 3hr', xp: 200, icon: Sparkles },
                        ].map(q => (
                            <div key={q.title} className="shrink-0 clay-sm flex items-center gap-2.5 pl-2 pr-3 h-10 rounded-clay text-xs font-bold text-text-secondary whitespace-nowrap">
                                <div className="clay-sunk w-6 h-6 rounded-clay flex items-center justify-center text-primary shrink-0">
                                    <q.icon className="w-3.5 h-3.5" />
                                </div>
                                {q.title}
                                <span className="text-primary font-mono">+{q.xp}</span>
                            </div>
                        ))}
                        <button
                            onClick={() => setShowXPSystem(true)}
                            className="shrink-0 text-[11px] font-bold text-primary hover:underline ml-auto pl-2"
                        >
                            How XP works
                        </button>
                    </section>
                )}

                {isGuest && (
                    <section className="clay rounded-clay-lg p-6 flex flex-col items-center text-center justify-center">
                        <div className="clay-sunk w-14 h-14 rounded-clay flex items-center justify-center mb-4">
                            <Crown className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-base font-display font-bold text-text-primary mb-2">Unlock everything</h3>
                        <p className="text-sm text-text-secondary leading-relaxed mb-5 max-w-sm">
                            Sign in for AI roadmaps, progress tracking, daily missions and the global leaderboard.
                        </p>
                        <Link to="/register" className="btn-primary">
                            Create account
                        </Link>
                    </section>
                )}

                    <section>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div className="clay-sunk rounded-clay p-1.5 flex items-center gap-1.5 self-start">
                                <button
                                    onClick={() => setActiveTab('courses')}
                                    className={`px-4 h-10 rounded-clay-sm text-sm font-bold transition-all duration-200 ease-clay ${activeTab === 'courses' ? 'clay-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                                >
                                    My courses
                                </button>
                                <button
                                    onClick={() => setActiveTab('features')}
                                    className={`px-4 h-10 rounded-clay-sm text-sm font-bold transition-all duration-200 ease-clay ${activeTab === 'features' ? 'clay-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                                >
                                    What&apos;s new
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button id="tour-new-course" onClick={() => setShowCreate(v => !v)} className="btn-primary flex-1 sm:flex-none">
                                    {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {showCreate ? 'Cancel' : 'New mission'}
                                </button>
                                {user.role === 'admin' && (
                                    <Link
                                        to="/admin/feedback"
                                        className="clay-sm clay-interactive px-4 min-h-[44px] rounded-clay text-primary text-sm font-bold flex items-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Feedback
                                    </Link>
                                )}
                            </div>
                        </div>
                        {activeTab === 'courses' ? (
                            <>
                                {deleteError && (
                                    <div className="clay-sunk mb-4 rounded-clay px-4 py-3 text-sm font-semibold text-danger">
                                        {deleteError}
                                    </div>
                                )}
                                {showCreate && (
                                    <div className="mb-6">
                                        <CourseCreationForm 
                                            initialUrl={searchParams.get('createUrl') || ''}
                                            onSuccess={(courseId) => {
                                                setShowCreate(false);
                                                // Clear createUrl from URL after success
                                                if (searchParams.get('createUrl')) {
                                                    const nextParams = new URLSearchParams(searchParams);
                                                    nextParams.delete('createUrl');
                                                    setSearchParams(nextParams, { replace: true });
                                                }
                                                setRoadmapCourseId(courseId);
                                                queryClient.invalidateQueries({ queryKey: ['courses'] });
                                            }} 
                                        />
                                    </div>
                                )}
                                {coursesLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {Array(6).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
                                    </div>
                                ) : courses.length === 0 && !showCreate ? (
                                    <div className="clay rounded-clay-lg flex flex-col items-center justify-center py-20 px-6 text-center">
                                        <div className="clay-sunk w-16 h-16 rounded-clay flex items-center justify-center mb-5">
                                            <BookOpen className="w-7 h-7 text-text-muted" />
                                        </div>
                                        <h3 className="text-xl font-display font-bold text-text-primary mb-2">No courses yet</h3>
                                        <p className="text-sm mb-6 text-text-secondary max-w-sm">
                                            {isGuest
                                                ? "Try creating your first course to see how it works!"
                                                : "Paste a YouTube playlist to generate your first course."}
                                        </p>
                                        <button onClick={() => setShowCreate(true)} className="btn-primary">
                                            <Plus className="w-4 h-4" /> Create your first course
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {courses
                                                .filter(c => !optimisticHiddenIds.has(c._id))
                                                .slice(0, visibleCount)
                                                .map((c, idx) => (
                                                    <CourseCard
                                                        key={c._id}
                                                        course={c}
                                                        progress={progressMap[c._id]}
                                                        onDelete={handleDeleteCourse}
                                                        isDeleting={deletingCourseId === c._id}
                                                        priority={idx < 6}
                                                    />
                                                ))}
                                        </div>
                                        {visibleCount < courses.length && (
                                            <div className="flex justify-center pt-4">
                                                <button
                                                    onClick={() => setVisibleCount(prev => prev + 6)}
                                                    className="clay-sm clay-interactive inline-flex items-center gap-2 px-6 min-h-[44px] rounded-clay text-sm font-bold text-text-secondary hover:text-text-primary"
                                                >
                                                    Load more missions
                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="clay rounded-clay-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6">
                                    <h3 className="text-lg font-display font-bold text-text-primary">What&apos;s new</h3>
                                    <p className="text-sm text-text-secondary mt-1">The latest QuestXP enhancements.</p>
                                </div>
                                <div className="px-4 pb-4 space-y-3">
                                    {newFeatures.map((feature) => (
                                        <div key={feature.id} className="clay-sunk p-4 rounded-clay group">
                                            <div className="flex items-start gap-4">
                                                <div className="clay-sm w-11 h-11 shrink-0 rounded-clay flex items-center justify-center transition-transform duration-200 ease-clay group-hover:-translate-y-[2px]">
                                                    {feature.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-3 mb-1">
                                                        <h4 className="text-sm font-display font-bold text-text-primary">{feature.title}</h4>
                                                        <span className="badge-rare shrink-0">{feature.date}</span>
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
                        )}


                    </section>

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
            <StreakCalendarModal
                isOpen={showStreakCalendar}
                onClose={() => setShowStreakCalendar(false)}
                history={historyData}
                rank={stats?.rank?.current}
            />
            {!showUsernameModal && <UserTour />}

            {/* Undo Toast */}
            {showUndo && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-5 py-4 clay rounded-clay-lg animate-in slide-in-from-bottom-8 fade-in duration-300 max-w-[calc(100vw-2rem)]"
                >
                    <div className="clay-sunk flex items-center justify-center w-11 h-11 shrink-0 rounded-clay text-primary font-mono font-bold text-lg">
                        {undoCountdown}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Deleting course</span>
                        <span className="text-sm font-bold text-text-primary line-clamp-1">{showUndo.title}</span>
                    </div>
                    <button
                        onClick={handleUndoDelete}
                        className="btn-primary shrink-0 text-sm"
                    >
                        Undo
                    </button>
                </div>
            )}
        </div>

    );
};

const StreakCalendarModal = ({ isOpen, onClose, history, rank }) => {
    const trapRef = useFocusTrap(isOpen, onClose);

    return createPortal(
        <>
            {isOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div onClick={onClose} className="absolute inset-0 bg-bg/80 backdrop-blur-sm" />
                    <div
                        ref={trapRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Streak calendar"
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10 pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                    >
                        <button
                            onClick={onClose}
                            className="absolute -top-3 -right-3 z-20 clay-sm clay-interactive w-9 h-9 flex items-center justify-center rounded-full bg-surface"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4 text-text-muted" />
                        </button>
                        <StreakCalendar history={history} rank={rank} />
                    </div>
                </div>
            )}
        </>,
        document.body
    );
};

const XPSystemModal = ({ isOpen, onClose }) => {
    const trapRef = useFocusTrap(isOpen, onClose);
    const mechanics = [
        { title: "Progressive Lectures", desc: "Gain more XP as you go. Lecture 1 (+50 XP), Lecture 2 (+60 XP), and so on!", icon: <BookOpen className="w-5 h-5" />, color: "text-cyan" },
        { title: "Study Streaks", desc: "Keep the flame alive! 1.25x (7 days), 1.5x (14 days), 2x (30 days), up to 3x multiplier!", icon: <Flame className="w-5 h-5" />, color: "text-warning" },
        { title: "Daily Goals", desc: "Hit your study goal for +50 XP bonus every single day.", icon: <Target className="w-5 h-5" />, color: "text-success" },
        { title: "Deep Focus", desc: "Secret bonuses for long sessions: 1hr (+50 XP) and 3hrs (+200 XP)!", icon: <Zap className="w-5 h-5" />, color: "text-primary" },
        { title: "Quiz Mastery", desc: "Ace a quiz for +75 XP. Improve your previous score for extra gains.", icon: <Trophy className="w-5 h-5" />, color: "text-gold" },
    ];

    return createPortal(
        <>
            {isOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div
                        onClick={onClose}
                        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
                    />
                    <div
                        ref={trapRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="How XP works"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg clay rounded-clay-xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] z-10 pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                    >
                        <div className="absolute top-0 right-0 p-5">
                            <button onClick={onClose} className="clay-sm clay-interactive w-10 h-10 flex items-center justify-center rounded-clay" aria-label="Close">
                                <X className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>

                        <div className="mb-7">
                            <div className="badge-rare inline-flex items-center gap-1.5 mb-4">
                                <Zap className="w-3 h-3" />
                                Leveling system
                            </div>
                            <h2 className="text-3xl font-display font-bold text-text-primary">How XP works</h2>
                            <p className="text-text-secondary mt-1.5">Master the system to climb faster.</p>
                        </div>

                        <div className="space-y-3">
                            {mechanics.map((m, i) => (
                                <div key={i} className="clay-sunk flex gap-4 p-4 rounded-clay group">
                                    <div className={`clay-sm shrink-0 w-12 h-12 rounded-clay flex items-center justify-center ${m.color} transition-transform duration-200 ease-clay group-hover:-translate-y-[2px]`}>
                                        {m.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-display font-bold text-text-primary">{m.title}</h4>
                                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{m.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-7">
                            <button
                                onClick={onClose}
                                className="w-full btn-primary"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
};

export default Dashboard;
