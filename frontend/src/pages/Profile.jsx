import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Flame, Trophy, Shield, Star, BookOpen, BarChart3, Calendar } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import { getGamificationProfile, getXPHistory, markBadgesSeen } from '../services/gamificationApi';
import NavBar from '../components/NavBar';
import { BGPattern } from '../components/ui/bg-pattern';

/* ── Streak Heatmap ─────────────────────────────────────────────────── */
function StreakHeatmap({ history = [] }) {
    // Build a map of date → totalXP
    const xpByDate = {};
    history.forEach(d => { xpByDate[d.date] = d.totalXP; });

    const today = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push({ key, xp: xpByDate[key] || 0 });
    }

    const max = Math.max(...days.map(d => d.xp), 1);

    const cellColor = (xp) => {
        if (xp === 0) return 'var(--color-surface-2)';
        const intensity = Math.min(xp / max, 1);
        if (intensity < 0.33) return 'oklch(0.88 0.035 155)';
        if (intensity < 0.66) return 'oklch(0.72 0.07 155)';
        return 'var(--color-primary)';
    };

    return (
        <div>
            <div className="flex flex-wrap gap-1.5">
                {days.map(d => (
                    <div
                        key={d.key}
                        title={`${d.key}: ${d.xp} XP`}
                        className="w-7 h-7 rounded-md transition-all hover:scale-110 cursor-default"
                        style={{ background: cellColor(d.xp), border: '1px solid rgba(255,255,255,0.04)' }}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
                <span>Less</span>
                {['var(--color-surface-2)', 'oklch(0.88 0.035 155)', 'oklch(0.72 0.07 155)', 'var(--color-primary)'].map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ background: c }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}

/* ── Hex Badge ──────────────────────────────────────────────────────── */
function HexBadge({ name, earned, iconColor = 'var(--color-text-muted)' }) {
    return (
        <div className="flex flex-col items-center gap-2 group">
            <div
                className="hex-clip w-14 h-14 flex items-center justify-center transition-all"
                style={{
                    background: earned ? 'oklch(0.95 0.035 78)' : 'var(--color-surface-2)',
                    opacity: earned ? 1 : 0.4,
                }}
            >
                <Star className="w-6 h-6" style={{ color: earned ? iconColor : 'var(--color-text-muted)' }} />
            </div>
            <p className="text-[10px] font-semibold text-center leading-tight max-w-[60px]" style={{ color: earned ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {name}
            </p>
        </div>
    );
}

/* ── Profile ────────────────────────────────────────────────────────── */
const Profile = () => {
    const { user } = useAuthStore();
    const { totalXP, level, levelTitle, streak, badges, xpToNextLevel, setProfile } = useGamificationStore();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            getGamificationProfile().then(d => setProfile(d)),
            getXPHistory().then(d => setHistory(d)),
            markBadgesSeen()
        ]).finally(() => setLoading(false));
    }, [setProfile]);

    if (!user) return null;

    const xpProgress = xpToNextLevel
        ? Math.round(((totalXP % 1000) / 1000) * 100)
        : 100;

    return (
        <div className="min-h-screen bg-bg text-text-primary relative overflow-hidden">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-15 z-0" />
            <NavBar />

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-8">

                {/* ── Profile Header ── */}
                <section className="glass-card p-8 flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                    {/* Avatar + Level Ring */}
                    <div className="relative shrink-0">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold text-white"
                            style={{
                                background: 'var(--color-primary)',
                                border: '3px solid var(--color-surface)',
                                boxShadow: '0 0 0 1px var(--color-border)'
                            }}
                        >
                            {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        {/* Level badge */}
                        <div
                            className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2"
                            style={{ background: 'var(--color-gold)', color: 'var(--color-text-primary)', borderColor: 'var(--color-surface)' }}
                        >
                            {level}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary mb-1">
                            {user.name}
                        </h1>
                        <p className="text-sm mb-4 text-text-secondary">
                            {levelTitle || 'Explorer'} · Level {level}
                        </p>

                        {/* XP Progress bar */}
                        <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-text-secondary">XP to Level {(level || 1) + 1}</span>
                            <span className="font-semibold text-text-primary">
                                {totalXP?.toLocaleString()} / {xpToNextLevel ? (totalXP + xpToNextLevel).toLocaleString() : '—'} XP
                            </span>
                        </div>
                        <div className="progress-bar max-w-sm">
                            <div className="progress-bar__fill progress-bar__fill--gold" style={{ width: `${xpProgress}%` }} />
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-4 sm:gap-6 shrink-0">
                        {[
                            { icon: <Zap className="w-4 h-4" />, val: (totalXP || 0).toLocaleString(), label: 'Total XP', color: 'var(--color-gold)' },
                            { icon: <Flame className="w-4 h-4" />, val: `${streak?.current ?? 0}d`, label: 'Streak', color: 'var(--color-warning)' },
                            { icon: <Trophy className="w-4 h-4" />, val: badges.filter(b => b.earned).length, label: 'Badges', color: 'var(--color-success)' },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col items-center gap-1">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                                    {s.icon}
                                </div>
                                <span className="text-lg font-semibold text-text-primary">{s.val}</span>
                                <span className="text-[10px] uppercase tracking-wide text-text-muted">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Streak Heatmap ── */}
                <section className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Study streak, last 30 days</h2>
                        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'oklch(0.95 0.04 70)', border: '1px solid oklch(0.84 0.08 70)', color: 'var(--color-warning)' }}>
                            <Flame className="w-3.5 h-3.5 streak-flame" /> {streak?.current ?? 0} Day Streak
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex flex-wrap gap-1.5">
                            {[...Array(30)].map((_, i) => <div key={i} className="skeleton w-7 h-7 rounded-md" />)}
                        </div>
                    ) : (
                        <StreakHeatmap history={history} />
                    )}
                </section>

                {/* ── Badges / Achievements ── */}
                <section className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="w-4 h-4 text-gold" />
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Achievements</h2>
                        <span className="ml-auto text-xs text-text-muted">{badges.filter(b => b.earned).length} / {badges.length} unlocked</span>
                    </div>

                    {badges.length === 0 ? (
                        <div className="flex flex-wrap gap-6">
                            {['First Quest', 'Speed Runner', 'React Master', '7-Day Streak', 'AI Explorer', 'Course Creator'].map(name => (
                                <HexBadge key={name} name={name} earned={false} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-6">
                            {badges.map(b => (
                                <HexBadge
                                    key={b.id}
                                    name={b.name}
                                    earned={b.earned}
                                    iconColor={b.earned ? 'var(--color-gold)' : 'var(--color-text-muted)'}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── XP History Table ── */}
                {history.length > 0 && (
                    <section className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Recent XP activity</h2>
                        </div>
                        <div className="space-y-2">
                            {history.slice(-10).reverse().map(day => (
                                <div key={day.date} className="flex items-center justify-between py-2 border-b border-border">
                                    <span className="text-sm text-text-secondary">{day.date}</span>
                                    <div className="flex items-center gap-1.5 xp-chip">
                                        <Zap className="w-3 h-3" /> +{day.totalXP} XP
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
};

export default Profile;
