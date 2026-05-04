import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Zap, Trophy, Shield, BookOpen, Plus, ChevronRight, Star } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import api from '../services/api';
import { getGamificationProfile } from '../services/gamificationApi';
import NavBar from '../components/NavBar';
import XPLeaderboardSidebar from '../components/Dashboard/XPLeaderboardSidebar';
import CourseCreationForm from '../components/Course/CourseCreationForm';
import { BGPattern } from '../components/ui/bg-pattern';

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
function CourseCard({ course, progress }) {
    const pct = calcCourseProgress(course, progress);
    const xpPool = (course?.totalLectures || 0) * XP_PER_LECTURE;
    // Backend now hoists first lecture thumbnail to course.thumbnailUrl
    const thumb = course?.thumbnailUrl || course?.sections?.[0]?.lectures?.[0]?.thumbnailUrl;

    // Find the first incomplete lecture for "Resume"
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
            {/* Thumbnail as background-image */}
            <div
                className="relative w-full aspect-video overflow-hidden"
                style={{
                    background: thumb
                        ? `linear-gradient(to bottom, oklch(0.23 0.018 88 / 0) 40%, oklch(0.23 0.018 88 / 0.62) 100%), url(${thumb}) center / cover no-repeat`
                        : 'var(--color-surface-2)',
                }}
            >
                {!thumb && (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-text-muted" />
                    </div>
                )}
                {/* XP chip */}
                <div className="absolute top-2 right-2 xp-chip">
                    <Zap className="w-3 h-3" /> +{xpPool} XP
                </div>
                {/* Progress badge */}
                <div className="absolute bottom-2 left-2 bg-surface/90 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ color: pct === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>
                    {pct}%
                </div>
            </div>

            {/* Body */}
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
                        <Link
                            to={`/courses/${course._id}/lectures/${resumeId}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 hover:underline"
                        >
                            Resume Mission <ChevronRight className="w-3 h-3" />
                        </Link>
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

    const [courses, setCourses] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [showCreate, setShowCreate] = useState(false);
    const [gamifLoaded, setGamifLoaded] = useState(false);

    // Fetch gamification profile
    useEffect(() => {
        getGamificationProfile()
            .then(data => { setProfile(data); setGamifLoaded(true); })
            .catch(() => setGamifLoaded(true));
    }, [setProfile]);

    // Fetch courses
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get('/courses');
                setCourses(data.courses || []);
                const pMap = {};
                await Promise.allSettled((data.courses || []).map(async c => {
                    try {
                        const p = await api.get(`/progress/${c._id}`);
                        if (p.data.progress) pMap[c._id] = p.data.progress;
                    } catch (_) {}
                }));
                setProgressMap(pMap);
            } catch (_) {}
        };
        load();
    }, []);

    if (!user) return null;

    const activeCourse = courses[0];
    const activePct = activeCourse ? calcCourseProgress(activeCourse, progressMap[activeCourse._id]) : 0;
    const firstLecId = activeCourse?.sections?.[0]?.lectures?.[0]?._id;

    return (
        <div className="min-h-screen bg-bg text-text-primary relative overflow-hidden">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-15" />
            <NavBar />

            {/* Layout */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 flex gap-6">

                {/* ── Left / Main ── */}
                <div className="flex-1 min-w-0 space-y-8">

                    {/* ── Hero Banner ── */}
                    {activeCourse && (
                        <section
                            className="relative rounded-xl overflow-hidden p-7 flex flex-col sm:flex-row gap-6 items-start bg-surface border border-border"
                            style={{
                                boxShadow: 'var(--shadow-card)'
                            }}
                        >
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

                                {/* XP earned */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="xp-chip"><Zap className="w-3 h-3" /> {activePct * (activeCourse.totalLectures * XP_PER_LECTURE) / 100 | 0} / {activeCourse.totalLectures * XP_PER_LECTURE} XP</span>
                                    <span className="text-xs text-text-muted">{activePct}% complete</span>
                                </div>

                                {/* Progress */}
                                <div className="progress-bar mb-4 max-w-xs">
                                    <div className="progress-bar__fill" style={{ width: `${activePct}%` }} />
                                </div>

                                {/* CTA */}
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

                    {/* ── Stats Row ── */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Zap className="w-4 h-4" />}
                            label="Total XP"
                            value={(totalXP || user?.totalXP || 0).toLocaleString()}
                            color="var(--color-gold)"
                            glow
                        />
                        <StatCard
                            icon={<Flame className="w-4 h-4" />}
                            label="Streak"
                            value={`${streak?.current ?? user?.streak?.current ?? 0}d`}
                            color="var(--color-warning)"
                            glow
                        />
                        <StatCard
                            icon={<Trophy className="w-4 h-4" />}
                            label="Completed"
                            value={courses.filter(c => calcCourseProgress(c, progressMap[c._id]) === 100).length}
                            color="var(--color-success)"
                        />
                        <StatCard
                            icon={<Shield className="w-4 h-4" />}
                            label={`Level`}
                            value={`Lv ${level || user?.level || 1}`}
                            color="var(--color-primary)"
                            glow
                        />
                    </section>

                    {/* ── My Active Courses ── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                                Active courses
                            </h2>
                            <button
                                onClick={() => setShowCreate(v => !v)}
                                className="btn-primary py-2 px-4 text-xs flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {showCreate ? 'Cancel' : 'New Course'}
                            </button>
                        </div>

                        {showCreate && (
                            <div className="mb-6">
                                <CourseCreationForm onSuccess={() => setShowCreate(false)} />
                            </div>
                        )}

                        {courses.length === 0 && !showCreate ? (
                            <div className="glass-card flex flex-col items-center justify-center py-20 text-center" style={{ borderStyle: 'dashed' }}>
                                <BookOpen className="w-12 h-12 mb-4 text-text-muted" />
                                <h3 className="text-lg font-semibold text-text-primary mb-2">No courses yet</h3>
                                <p className="text-sm mb-6 text-text-secondary">
                                    Paste a YouTube playlist to generate your first structured, gamified course.
                                </p>
                                <button onClick={() => setShowCreate(true)} className="btn-esports">
                                    Create your first course
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {courses.map(c => (
                                    <CourseCard key={c._id} course={c} progress={progressMap[c._id]} />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── Featured Quests ── */}
                    {courses.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold tracking-tight text-text-primary mb-4">
                                Featured courses
                            </h2>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {courses.map((c, i) => {
                                    const xpPool = (c?.totalLectures || 0) * XP_PER_LECTURE;
                                    const thumb = c?.sections?.[0]?.lectures?.[0]?.thumbnailUrl;
                                    return (
                                        <Link
                                            key={c._id}
                                            to={`/courses/${c._id}`}
                                            className="shrink-0 w-56 glass-card-gold group hover:scale-105 transition-transform overflow-hidden"
                                            style={{ padding: 0, borderRadius: 12 }}
                                        >
                                            <div className="relative w-full aspect-video bg-surface-2 overflow-hidden">
                                                {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <Star className="w-8 h-8 m-auto mt-6 text-text-muted" />}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.23_0.018_88_/_0.55)] via-transparent to-transparent" />
                                                <span className={`absolute top-2 left-2 ${i % 2 === 0 ? 'badge-epic' : 'badge-rare'}`}>
                                                    {i % 2 === 0 ? 'EPIC' : 'RARE'}
                                                </span>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-xs font-semibold text-text-primary line-clamp-2 mb-1">{c.title}</p>
                                                <div className="xp-chip"><Zap className="w-3 h-3" /> +{xpPool} XP</div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>

                {/* ── Right Sidebar ── */}
                <aside className="hidden xl:flex flex-col w-72 shrink-0 space-y-4">
                    <XPLeaderboardSidebar players={user ? [{ name: user.name, totalXP: totalXP || user.totalXP || 0, level: level || user.level || 1 }] : []} />

                    {/* User Profile Quick-card */}
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
                        <p className="text-xs text-right text-text-muted">View full profile</p>
                    </Link>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
