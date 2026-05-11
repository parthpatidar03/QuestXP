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
                            { icon: <img src="/favicon.png" alt="" className="w-5 h-5 object-contain" />, val: (totalXP || 0).toLocaleString(), label: 'Total XP', color: 'var(--color-gold)' },
                            { icon: <Flame className="w-5 h-5" />, val: `${streak?.current ?? 0}d`, label: 'Streak', color: 'var(--color-warning)' },
                            { icon: <Trophy className="w-5 h-5" />, val: badges.filter(b => b.earned).length, label: 'Badges', color: 'var(--color-success)' },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}30`, padding: '10px' }}>
                                    {s.icon}
                                </div>
                                <span className="text-2xl font-black text-white tracking-tight">{s.val}</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Badges & History Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* ── Badges / Achievements ── */}
                    <section className="glass-card p-8 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                                <Shield className="w-5 h-5 text-gold" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Achievements</h2>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{badges.filter(b => b.earned).length} / {badges.length} unlocked</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 flex-1">
                            {badges.length === 0 ? (
                                ['First Quest', 'Speed Runner', 'React Master', '7-Day Streak'].map(name => (
                                    <HexBadge key={name} name={name} earned={false} />
                                ))
                            ) : (
                                badges.map(b => (
                                    <HexBadge
                                        key={b.id}
                                        name={b.name}
                                        earned={b.earned}
                                        iconColor={b.earned ? 'var(--color-gold)' : 'var(--color-text-muted)'}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    {/* ── XP History Table ── */}
                    <section className="glass-card p-8 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <BarChart3 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>XP Activity</h2>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Recent performance</p>
                            </div>
                        </div>

                        {history.length > 0 ? (
                            <div className="space-y-4 flex-1">
                                {history.slice(-6).reverse().map(day => (
                                    <div key={day.date} className="flex items-center justify-between p-4 rounded-2xl bg-surface-2/40 border border-border/40 hover:border-primary/20 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-text-secondary">{new Date(day.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/20 flex items-center gap-2">
                                            <img src="/favicon.png" alt="" className="w-3.5 h-3.5 object-contain" />
                                            <span className="text-xs font-black text-gold">+{day.totalXP} XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-text-muted italic text-sm opacity-50">
                                No recent activity found.
                            </div>
                        )}
                    </section>
                </div>

                {/* Log Out Button (Standalone) */}
                <div className="flex flex-col items-center justify-center gap-4 pt-8">
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="group flex items-center gap-3 rounded-2xl bg-red-500/10 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-500 hover:text-white border border-red-500/20 shadow-lg shadow-red-500/5 active:scale-95 disabled:opacity-50"
                    >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        {isLoggingOut ? 'Terminating Session...' : 'Sign Out of QuestXP'}
                    </button>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40">
                        Member since {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
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
