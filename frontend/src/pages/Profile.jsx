import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Flame, Trophy, Shield, Star, BookOpen, BarChart3, Calendar } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import { getGamificationProfile, getXPHistory, markBadgesSeen } from '../services/gamificationApi';
import NavBar from '../components/NavBar';

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
        if (xp === 0) return '#1a1e35';
        const intensity = Math.min(xp / max, 1);
        if (intensity < 0.33) return 'rgba(0,180,255,0.3)';
        if (intensity < 0.66) return 'rgba(0,180,255,0.6)';
        return '#00b4ff';
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
            <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: '#4a5480' }}>
                <span>Less</span>
                {['#1a1e35', 'rgba(0,180,255,0.3)', 'rgba(0,180,255,0.6)', '#00b4ff'].map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ background: c }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}

/* ── Hex Badge ──────────────────────────────────────────────────────── */
function HexBadge({ name, earned, iconColor = '#8b9cc8' }) {
    return (
        <div className="flex flex-col items-center gap-2 group">
            <div
                className="hex-clip w-14 h-14 flex items-center justify-center transition-all"
                style={{
                    background: earned ? `rgba(${iconColor === '#f5a524' ? '245,165,36' : '0,180,255'},0.18)` : '#12152a',
                    opacity: earned ? 1 : 0.4,
                    boxShadow: earned ? `0 0 16px ${iconColor}50` : 'none'
                }}
            >
                <Star className="w-6 h-6" style={{ color: earned ? iconColor : '#2a2f52' }} />
            </div>
            <p className="text-[10px] font-semibold text-center leading-tight max-w-[60px]" style={{ color: earned ? '#eef2ff' : '#4a5480' }}>
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
        <div className="min-h-screen" style={{ background: '#0d0f1a' }}>
            <NavBar />

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-8">

                {/* ── Profile Header ── */}
                <section className="glass-card p-8 flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                    {/* Avatar + Level Ring */}
                    <div className="relative shrink-0">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white"
                            style={{
                                background: 'linear-gradient(135deg, #00b4ff, #0055ff)',
                                border: '3px solid transparent',
                                boxShadow: '0 0 0 3px #f5a524, 0 0 30px rgba(245,165,36,0.4)'
                            }}
                        >
                            {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        {/* Level badge */}
                        <div
                            className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2"
                            style={{ background: '#f5a524', color: '#0d0f1a', borderColor: '#0d0f1a' }}
                        >
                            {level}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl sm:text-4xl font-black text-white mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {user.name}
                        </h1>
                        <p className="text-sm mb-4" style={{ color: '#8b9cc8' }}>
                            {levelTitle || 'Explorer'} · Level {level}
                        </p>

                        {/* XP Progress bar */}
                        <div className="mb-1 flex items-center justify-between text-xs">
                            <span style={{ color: '#8b9cc8' }}>XP to Level {(level || 1) + 1}</span>
                            <span className="font-bold" style={{ color: '#f5a524' }}>
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
                            { icon: <Zap className="w-4 h-4" />, val: (totalXP || 0).toLocaleString(), label: 'Total XP', color: '#f5a524' },
                            { icon: <Flame className="w-4 h-4" />, val: `${streak?.current ?? 0}d`, label: 'Streak', color: '#f97316' },
                            { icon: <Trophy className="w-4 h-4" />, val: badges.filter(b => b.earned).length, label: 'Badges', color: '#10B981' },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col items-center gap-1">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                                    {s.icon}
                                </div>
                                <span className="text-lg font-black" style={{ color: s.color, fontFamily: "'Barlow Condensed', sans-serif" }}>{s.val}</span>
                                <span className="text-[10px] uppercase tracking-wider" style={{ color: '#4a5480' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Streak Heatmap ── */}
                <section className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Calendar className="w-4 h-4 text-[#00b4ff]" />
                        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8b9cc8' }}>Study Streak — Last 30 Days</h2>
                        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>
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
                        <Shield className="w-4 h-4 text-[#f5a524]" />
                        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8b9cc8' }}>Achievements</h2>
                        <span className="ml-auto text-xs" style={{ color: '#4a5480' }}>{badges.filter(b => b.earned).length} / {badges.length} Unlocked</span>
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
                                    iconColor={b.earned ? '#f5a524' : '#4a5480'}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── XP History Table ── */}
                {history.length > 0 && (
                    <section className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-4 h-4 text-[#00b4ff]" />
                            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8b9cc8' }}>Recent XP Activity</h2>
                        </div>
                        <div className="space-y-2">
                            {history.slice(-10).reverse().map(day => (
                                <div key={day.date} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#1a1e35' }}>
                                    <span className="text-sm" style={{ color: '#8b9cc8' }}>{day.date}</span>
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
