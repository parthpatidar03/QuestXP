import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Search, BookOpenCheck, Moon, Sun, BookOpen, X, Loader2, Star, Menu, Trophy, Layout } from 'lucide-react';
import NotificationBell from './NotificationBell';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import { getGamificationProfile } from '../services/gamificationApi';

import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

import CourseSearch from './Course/CourseSearch';

/* ── NavBar ──────────────────────────────────────────────────────────── */
const NavBar = () => {
    const { user } = useAuthStore();
    const { totalXP, level, setProfile } = useGamificationStore();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    const [mobileOpen, setMobileOpen] = useState(false);
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

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex items-center h-16 gap-4">

                <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-4">
                    <img src="/favicon.png" alt="QuestXP" className="w-9 h-9 object-contain rounded-lg" />
                    <span className="text-lg font-semibold tracking-tight text-text-primary">
                        QuestXP
                    </span>
                </Link>

                {/* Live search - hidden on mobile header, shown in mobile menu */}
                <div className="hidden md:flex flex-1 items-center gap-2">
                    <CourseSearch />
                    <a 
                        href="https://www.youtube.com/feed/playlists"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-glass flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-bold transition-all hover:bg-surface-3 group border border-border whitespace-nowrap"
                    >
                        <Star className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span className="hidden lg:inline">Explore more courses</span>
                        <span className="lg:hidden">Explore more</span>
                    </a>
                </div>

                <div className="flex-1 md:hidden" />

                <nav className="hidden md:flex items-center gap-1 mr-2">
                    <Link to={`/dashboard${demoQuery}`} className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        Dashboard
                    </Link>
                    <Link id="tour-roadmap" to={`/roadmap${demoQuery}`} className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        Roadmap
                    </Link>
                    <Link id="tour-leaderboard" to={`/dashboard${demoQuery}${isDemo ? '&' : '?'}open=leaderboard`} className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-gold" />
                        Leaderboard
                    </Link>

                </nav>

                <div className="hidden sm:flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-xl px-3 py-1.5">
                        <img src="/favicon.png" alt="" className="w-4 h-4 object-contain" />
                        <span className="text-sm font-semibold text-text-primary">{(totalXP || user?.totalXP || 0).toLocaleString()} XP</span>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
                        title="Toggle theme"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <NotificationBell
                        profile={{ totalXP, level, levelTitle: useGamificationStore.getState().levelTitle, streak: useGamificationStore.getState().streak, badges: useGamificationStore.getState().badges }}
                        user={user}
                    />
                </div>


                <Link to={`/profile${demoQuery}`} className="hidden sm:flex relative items-center gap-2 group">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full border border-border p-0.5 bg-surface">
                            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xs">
                                {(user?.username || user?.name)?.split(/[ _]/).map(n => n[0]).join('').toUpperCase() ?? 'Q'}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gold text-text-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-surface">
                            {level || user?.level || 1}
                        </div>
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate max-w-[100px]">
                        {user?.username || user?.name || 'Player'}
                    </span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

            </div>

            {/* Mobile Navigation Overlay */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-surface/98 backdrop-blur-xl animate-in slide-in-from-top duration-300">
                    <div className="p-4 space-y-4">
                        {/* Mobile Search */}
                        <div className="px-1">
                            <CourseSearch />
                        </div>

                        {/* Mobile Nav Links */}
                        <div className="grid grid-cols-2 gap-2">
                            <Link 
                                to={`/dashboard${demoQuery}`} 
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text-primary"
                            >
                                <Zap className="w-5 h-5 text-warning" />
                                Dashboard
                            </Link>
                            <Link 
                                to={`/roadmap${demoQuery}`} 
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text-primary"
                            >
                                <Layout className="w-5 h-5 text-primary" />
                                Roadmap
                            </Link>
                            <Link 
                                to={`/dashboard${demoQuery}${isDemo ? '&' : '?'}open=leaderboard`} 
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text-primary"
                            >
                                <Trophy className="w-5 h-5 text-gold" />
                                Rankings
                            </Link>
                            <a 
                                href="https://www.youtube.com/feed/playlists"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text-primary"
                            >
                                <Star className="w-5 h-5 text-gold" />
                                Explore more
                            </a>
                            <Link 
                                to="/profile" 
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text-primary"
                            >
                                <Trophy className="w-5 h-5 text-success" />
                                Profile
                            </Link>
                        </div>

                        {/* Mobile Stats Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-surface-2 border border-border flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Mastery</span>
                                    <span className="text-lg font-black text-text-primary">{(totalXP || user?.totalXP || 0).toLocaleString()} XP</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-surface-2 border border-border flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Theme</span>
                                    <button onClick={toggleTheme} className="text-sm font-bold text-text-primary flex items-center gap-2 mt-1">
                                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                        {isDark ? 'Light' : 'Dark'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-surface-2 border border-border flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                    {(user?.username || user?.name)?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">{user?.username || user?.name}</p>
                                    <p className="text-xs text-text-muted">Level {level || 1}</p>
                                </div>
                             </div>
                             <Link 
                                to={`/profile${demoQuery}`} 
                                onClick={() => setMobileOpen(false)}
                                className="px-4 py-2 rounded-lg bg-surface-3 text-xs font-bold text-text-primary"
                             >
                                Edit Profile
                             </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default NavBar;
