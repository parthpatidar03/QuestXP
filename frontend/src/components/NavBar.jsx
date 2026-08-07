import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, X, Star, Menu, Trophy, Layout, Zap, Users, User } from 'lucide-react';
import XPCurrency from './XPCurrency';
import NotificationBell from './NotificationBell';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import { getGamificationProfile } from '../services/gamificationApi';


import CourseSearch from './Course/CourseSearch';

/* ── NavBar ──────────────────────────────────────────────────────────── */
const NavBar = () => {
    const { user } = useAuthStore();
    const { totalXP, level, setProfile } = useGamificationStore();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true' || user?.guest;
    const demoQuery = isDemo ? '?demo=true' : '';


    useEffect(() => {
        getGamificationProfile()
            .then(data => setProfile(data))
            .catch(() => {});
    }, [setProfile]);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    // Active links get the pressed-clay treatment — the nav reads like a row
    // of physical keys, one of which is held down.
    const navLink = (to, label, extra = '', id) => {
        const active = location.pathname === to.split('?')[0];
        return (
            <Link
                key={label}
                id={id}
                to={to}
                className={`px-4 h-10 flex items-center gap-1.5 rounded-clay text-sm font-bold whitespace-nowrap transition-all duration-200 ease-clay ${
                    active
                        ? 'clay-sunk text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:clay-sm hover:-translate-y-[2px]'
                } ${extra}`}
            >
                {label}
            </Link>
        );
    };

    return (
        <header className="sticky top-0 z-50 w-full px-3 sm:px-5 pt-3 pb-1">
            <div className="mx-auto max-w-screen-2xl clay rounded-clay-lg px-3 sm:px-4 flex items-center h-16 gap-3">

                <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                    <img
                        src="/logo-mark.webp"
                        alt="QuestXP"
                        className="w-9 h-9 object-contain transition-transform duration-200 ease-clay group-hover:scale-105 group-active:scale-95"
                    />
                    <span className="text-lg font-display font-bold tracking-tight text-text-primary hidden xs:block">
                        QuestXP
                    </span>
                </Link>

                {/* Live search - hidden on mobile header, shown in mobile menu */}
                <div className="hidden md:flex flex-1 items-center gap-2 min-w-0">
                    <CourseSearch />
                    <a
                        href="https://www.youtube.com/feed/playlists"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clay-sm clay-interactive flex items-center gap-2 px-4 h-10 rounded-clay text-sm font-bold text-text-secondary hover:text-text-primary group whitespace-nowrap shrink-0"
                    >
                        <Star className="w-4 h-4 text-primary transition-transform group-hover:scale-110" />
                        <span className="hidden xl:inline">Explore more courses</span>
                        <span className="xl:hidden">Explore</span>
                    </a>
                </div>

                <div className="flex-1 md:hidden" />

                <nav className="hidden md:flex items-center gap-1.5">
                    {navLink(`/dashboard${demoQuery}`, 'Dashboard')}
                    {navLink(`/roadmap${demoQuery}`, 'Roadmap', '', 'tour-roadmap')}
                    <Link
                        id="tour-leaderboard"
                        to={`/dashboard${demoQuery}${isDemo ? '&' : '?'}open=leaderboard`}
                        className="px-4 h-10 flex items-center gap-1.5 rounded-clay text-sm font-bold text-text-secondary hover:text-text-primary hover:clay-sm hover:-translate-y-[2px] transition-all duration-200 ease-clay whitespace-nowrap"
                    >
                        <Trophy className="w-3.5 h-3.5 text-gold" />
                        <span className="hidden lg:inline">Leaderboard</span>
                    </Link>
                    {navLink('/friendzones', 'Friends')}
                </nav>

                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="clay-sunk-sm flex items-center gap-1.5 rounded-clay px-3 h-10">
                        <XPCurrency amount={totalXP || user?.totalXP || 0} size="sm" />
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="clay-sm clay-interactive w-10 h-10 flex items-center justify-center rounded-clay text-text-secondary hover:text-text-primary"
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                    </button>

                    <NotificationBell
                        profile={{ totalXP, level, levelTitle: useGamificationStore.getState().levelTitle, streak: useGamificationStore.getState().streak, badges: useGamificationStore.getState().badges }}
                        user={user}
                    />
                </div>


                <Link to={`/profile${demoQuery}`} className="hidden sm:flex relative items-center gap-2 group shrink-0">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-clay flex items-center justify-center text-white font-display font-bold text-sm clay-pop-sm transition-transform duration-200 ease-clay group-hover:-translate-y-[2px]"
                             style={{ background: 'linear-gradient(150deg, var(--color-primary), var(--color-primary-hover))' }}>
                            {(user?.username || user?.name)?.split(/[ _]/).map(n => n[0]).join('').toUpperCase() ?? 'Q'}
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 bg-surface text-text-primary text-[10px] font-mono font-bold rounded-full w-5 h-5 flex items-center justify-center clay-sm">
                            {level || user?.level || 1}
                        </div>
                    </div>
                    <span className="hidden xl:block text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate max-w-[100px]">
                        {user?.username || user?.name || 'Player'}
                    </span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden clay-sm clay-interactive w-11 h-11 flex items-center justify-center rounded-clay text-text-secondary"
                    aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={mobileOpen}
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

            </div>

            {/* Mobile Navigation Overlay */}
            {mobileOpen && (
                <div className="md:hidden mx-auto max-w-screen-2xl mt-3 clay rounded-clay-lg animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="p-4 space-y-4">
                        {/* Mobile Search */}
                        <div className="px-1">
                            <CourseSearch />
                        </div>

                        {/* Mobile Nav Links */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { to: `/dashboard${demoQuery}`, icon: Zap, color: 'text-primary', label: 'Dashboard' },
                                { to: `/roadmap${demoQuery}`, icon: Layout, color: 'text-cyan', label: 'Roadmap' },
                                { to: `/dashboard${demoQuery}${isDemo ? '&' : '?'}open=leaderboard`, icon: Trophy, color: 'text-gold', label: 'Rankings' },
                                { to: '/friendzones', icon: Users, color: 'text-success', label: 'Friends' },
                                { to: `/profile${demoQuery}`, icon: User, color: 'text-primary', label: 'Profile' },
                            ].map(({ to, icon: Icon, color, label }) => (
                                <Link
                                    key={label}
                                    to={to}
                                    onClick={() => setMobileOpen(false)}
                                    className="clay-sm clay-interactive flex items-center gap-3 p-3 min-h-[52px] rounded-clay text-sm font-bold text-text-primary"
                                >
                                    <Icon className={`w-5 h-5 ${color}`} />
                                    {label}
                                </Link>
                            ))}
                            <a
                                href="https://www.youtube.com/feed/playlists"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileOpen(false)}
                                className="clay-sm clay-interactive flex items-center gap-3 p-3 min-h-[52px] rounded-clay text-sm font-bold text-text-primary"
                            >
                                <Star className="w-5 h-5 text-gold" />
                                Explore
                            </a>
                        </div>

                        {/* Mobile Stats Summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="clay-sunk p-4 rounded-clay flex flex-col">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Mastery</span>
                                <XPCurrency amount={totalXP || user?.totalXP || 0} size="lg" />
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="clay-sm clay-interactive p-4 rounded-clay flex flex-col items-start min-h-[52px]"
                            >
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Theme</span>
                                <span className="text-sm font-bold text-text-primary flex items-center gap-2 mt-1">
                                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                    {isDark ? 'Light' : 'Dark'}
                                </span>
                            </button>
                        </div>

                        <div className="clay-sunk p-4 rounded-clay flex items-center justify-between gap-3">
                             <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 shrink-0 rounded-clay flex items-center justify-center text-white font-display font-bold text-sm clay-pop-sm"
                                     style={{ background: 'linear-gradient(150deg, var(--color-primary), var(--color-primary-hover))' }}>
                                    {(user?.username || user?.name)?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-text-primary truncate">{user?.username || user?.name}</p>
                                    <p className="text-xs text-text-muted font-mono">Level {level || 1}</p>
                                </div>
                             </div>
                             <Link
                                to={`/profile${demoQuery}`}
                                onClick={() => setMobileOpen(false)}
                                className="clay-sm clay-interactive shrink-0 px-4 h-11 flex items-center rounded-clay text-xs font-bold text-text-primary"
                             >
                                Edit
                             </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default NavBar;
