import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Trophy, Shield, Star, BookOpen, BarChart3, Calendar, LogOut, ShieldCheck, User } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import { getGamificationProfile, getXPHistory, markBadgesSeen } from '../services/gamificationApi';
import NavBar from '../components/NavBar';
import UsernameModal from '../components/Dashboard/UsernameModal';
import { BGPattern } from '../components/ui/bg-pattern';
import StreakCalendar from '../components/StreakCalendar';

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
    const { user, logout } = useAuthStore();
    const { totalXP, level, levelTitle, streak, badges, xpToNextLevel, setProfile } = useGamificationStore();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

    const [showUsernameModal, setShowUsernameModal] = useState(false);

    useEffect(() => {
        Promise.allSettled([
            getGamificationProfile().then(d => setProfile(d)),
            getXPHistory().then(d => setHistory(d)),
            markBadgesSeen()
        ]).finally(() => setLoading(false));
    }, [setProfile]);

    useEffect(() => {
        const handleOpen = () => setShowUsernameModal(true);
        window.addEventListener('open-username-modal', handleOpen);
        return () => window.removeEventListener('open-username-modal', handleOpen);
    }, []);

    if (!user) return null;

    // Derive join date from MongoDB ObjectId
    const joinDate = user._id ? new Date(parseInt(user._id.substring(0, 8), 16) * 1000) : new Date();

    const xpProgress = xpToNextLevel
        ? Math.round(((totalXP % 1000) / 1000) * 100)
        : 100;

    const handleLogout = async () => {
        setLogoutError('');
        setIsLoggingOut(true);
        try {
            await logout();
        } catch (_) {
            setLogoutError('Logout failed. Please try again.');
            setIsLoggingOut(false);
        }
    };

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
                            {(user.username || user.name)?.split(/[ _]/).map(n => n[0]).join('').toUpperCase()}
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
                        <div className="flex items-center flex-wrap gap-3 mb-2">
                            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {user.username || user.name}
                            </h1>
                            {!user.usernameSet && (
                                <span className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/40 text-[11px] font-black text-primary uppercase tracking-widest">
                                    Random Identity
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2 mb-6">
                            <p className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-gold" />
                                {levelTitle || 'Explorer'} · <span className="text-gold">Level {level}</span>
                            </p>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm text-text-muted">{user.email}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-username-modal'))}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-border text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 hover:border-primary/30 transition-all mb-8 shadow-sm"
                        >
                            <User className="w-3.5 h-3.5" />
                            Change Identity →
                        </button>

                        {/* XP Progress bar */}
                        <div className="max-w-md">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-text-secondary font-bold uppercase tracking-wider text-[11px]">XP to Level {(level || 1) + 1}</span>
                                <span className="font-black text-white">
                                    {totalXP?.toLocaleString()} / {xpToNextLevel ? (totalXP + xpToNextLevel).toLocaleString() : '—'} XP
                                </span>
                            </div>
                            <div className="h-3 w-full bg-surface-2 rounded-full overflow-hidden border border-border/50">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress}%` }}
                                    className="h-full bg-gradient-to-r from-gold to-amber-500 shadow-[0_0_12px_rgba(255,191,0,0.3)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-6 sm:gap-10 shrink-0 bg-surface-2/50 p-6 rounded-3xl border border-border/40 backdrop-blur-sm">
                        {[
                            { icon: <Zap className="w-5 h-5" />, val: (totalXP || 0).toLocaleString(), label: 'Total XP', color: 'var(--color-gold)' },
                            { icon: <Flame className="w-5 h-5" />, val: `${streak?.current ?? 0}d`, label: 'Streak', color: 'var(--color-warning)' },
                            { icon: <Trophy className="w-5 h-5" />, val: badges.filter(b => b.earned).length, label: 'Badges', color: 'var(--color-success)' },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}30` }}>
                                    {s.icon}
                                </div>
                                <span className="text-2xl font-black text-white tracking-tight">{s.val}</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Streak Calendar ── */}
                <section className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Study streak</h2>
                        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'oklch(0.95 0.04 70)', border: '1px solid oklch(0.84 0.08 70)', color: 'var(--color-warning)' }}>
                            <Flame className="w-3.5 h-3.5 streak-flame" /> {streak?.current ?? 0} Day Streak
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {[...Array(30)].map((_, i) => <div key={i} className="skeleton w-7 h-7 rounded-md" />)}
                        </div>
                    ) : (
                        <StreakCalendar history={history} />
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

                {/* Log Out Button (Standalone) */}
                <div className="flex justify-center mt-6">
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 hover:border-red-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? 'Logging out...' : 'Log out of QuestXP'}
                    </button>
                </div>
                {logoutError && (
                    <p className="text-center mt-2 text-xs text-red-400">{logoutError}</p>
                )}
            </div>
            <UsernameModal isOpen={showUsernameModal} onClose={() => setShowUsernameModal(false)} />
        </div>
    );
};

export default Profile;
