import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Zap, Trophy, Shield, BookOpen, Plus, ChevronRight, Star, Trash2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import api from '../services/api';
import { getGamificationProfile } from '../services/gamificationApi';
import NavBar from '../components/NavBar';
import XPLeaderboardSidebar from '../components/Dashboard/XPLeaderboardSidebar';
import CourseCreationForm from '../components/Course/CourseCreationForm';
import { BGPattern } from '../components/ui/bg-pattern';
import FeedbackModal from '../components/FeedbackModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatCardSkeleton, CourseCardSkeleton } from '../components/ui/Skeleton';
import Footer from '../components/ui/Footer';


/* ── Helpers ─────────────────────────────────────────────────────────── */
const XP_PER_LECTURE = 50;

function calcCourseProgress(course, progress) {
    const total = course?.totalLectures || 1;
    const done = progress?.completedLectures?.length || 0;
    return Math.round((done / total) * 100);
}

/* ── Stat Card ──────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, glow }) {
    return (
        <div className="glass-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-2" style={{ color }}>
                    {icon}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</span>
            </div>
            <span className="text-2xl font-semibold text-text-primary">
                {value}
            </span>
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

    return (
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
                    <Zap className="w-3 h-3" /> +{xpPool} XP
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
                <div className="absolute bottom-2 left-2 bg-surface/90 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ color: pct === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>
                    {pct}%
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-text-primary text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
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
    );
}

/* ── Dashboard ──────────────────────────────────────────────────────── */
const Dashboard = () => {
    const { user } = useAuthStore();
    const { totalXP, level, levelTitle, streak, setProfile } = useGamificationStore();
    const queryClient = useQueryClient();

    const [showCreate, setShowCreate] = useState(false);
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [feedbackOpen, setFeedbackOpen] = useState(false);
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

    const { data: coursesData, isLoading: coursesLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: async () => {
            const { data } = await api.get('/courses');
            return data.courses || [];
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
        const isSure = window.confirm(`Are you sure you want to permanently delete "${course.title}"? This action cannot be undone.`);
        if (!isSure) return;

        const verification = window.prompt('To confirm permanent deletion, type DELETE and click OK.');
        if ((verification || '').trim().toUpperCase() !== 'DELETE') return;

        setDeleteError('');
        setDeletingCourseId(course._id);
        deleteMutation.mutate(course._id, {
            onSettled: () => setDeletingCourseId(null)
        });
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
                        <section className="relative rounded-xl overflow-hidden p-7 flex flex-col sm:flex-row gap-6 items-start bg-surface border border-border shadow-card">
                            {activeCourse.sections?.[0]?.lectures?.[0]?.thumbnailUrl && (
                                <img
                                    src={activeCourse.sections[0].lectures[0].thumbnailUrl}
                                    alt="course"
                                    className="w-32 h-20 sm:w-44 sm:h-28 object-cover rounded-lg shrink-0 border border-border"
                                />
                            )}

                            <div className="relative flex-1 min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-primary">Continue studying</p>
                                <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-1 leading-tight">
                                    {activeCourse.title}
                                </h1>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="xp-chip"><Zap className="w-3 h-3" /> {Math.floor(activePct * (activeCourse.totalLectures * XP_PER_LECTURE) / 100)} / {activeCourse.totalLectures * XP_PER_LECTURE} XP</span>
                                    <span className="text-xs text-text-muted">{activePct}% complete</span>
                                </div>
                                <div className="progress-bar mb-4 max-w-xs">
                                    <div className="progress-bar__fill" style={{ width: `${activePct}%` }} />
                                </div>
                                {firstLecId && (
                                    <Link
                                        to={`/courses/${activeCourse._id}/lectures/${firstLecId}`}
                                        className="btn-esports inline-flex items-center gap-2 text-sm"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                        Resume Mission
                                    </Link>
                                )}
                            </div>
                        </section>
                    )}

                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {profileLoading ? (
                            Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
                        ) : (
                            <>
                                <StatCard icon={<Zap className="w-4 h-4" />} label="Total XP" value={(totalXP || user?.totalXP || 0).toLocaleString()} color="var(--color-gold)" />
                                <StatCard icon={<Flame className="w-4 h-4" />} label="Streak" value={`${streak?.current ?? user?.streak?.current ?? 0}d`} color="var(--color-warning)" />
                                <StatCard icon={<Trophy className="w-4 h-4" />} label="Completed" value={courses.filter(c => calcCourseProgress(c, progressMap[c._id]) === 100).length} color="var(--color-success)" />
                                <StatCard icon={<Shield className="w-4 h-4" />} label="Level" value={`Lv ${level || user?.level || 1}`} color="var(--color-primary)" />
                            </>
                        )}
                    </section>


                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold tracking-tight text-text-primary">Active courses</h2>
                            <button onClick={() => setShowCreate(v => !v)} className="btn-primary py-2 px-4 text-xs flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" />
                                {showCreate ? 'Cancel' : 'New Course'}
                            </button>
                        </div>
                        {deleteError && (
                            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {deleteError}
                            </div>
                        )}
                        {showCreate && (
                            <div className="mb-6">
                                <CourseCreationForm onSuccess={() => setShowCreate(false)} />
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
                                    {courses.slice(0, visibleCount).map(c => (
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

                <aside className="hidden xl:flex flex-col w-72 shrink-0 space-y-4">
                    <XPLeaderboardSidebar players={user ? [{ name: user.name, totalXP: totalXP || user.totalXP || 0, level: level || user.level || 1 }] : []} />
                    <Link to="/profile" className="glass-card block transition-all p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center font-semibold text-sm bg-primary text-white">
                                {user.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{user.name}</p>
                                <p className="text-xs text-text-secondary">{levelTitle || 'Explorer'} · Lv {level || user?.level}</p>
                            </div>
                        </div>
                        <div className="progress-bar mb-1">
                            <div className="progress-bar__fill" style={{ width: '62%' }} />
                        </div>
                        <p className="text-xs text-right text-text-secondary group-hover:text-primary transition-colors">View full profile</p>
                    </Link>
                </aside>
            </div>

            <Footer onOpenFeedback={() => setFeedbackOpen(true)} />
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} contextPage="Dashboard" />
        </div>
    );
};

export default Dashboard;
