import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Search, BookOpenCheck, Moon, Sun, BookOpen, X, Loader2, Star, Menu, Trophy } from 'lucide-react';
import NotificationBell from './NotificationBell';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import { getGamificationProfile } from '../services/gamificationApi';

import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/* ── Course Search Bar ───────────────────────────────────────────────── */
function CourseSearch() {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const [fetchedCourses, setFetchedCourses] = useState(null); // null = not yet fetched
    const [isFetching, setIsFetching] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    // Use cache if available, otherwise use API-fetched list
    const cachedCourses = queryClient.getQueryData(['courses']);
    const allCourses = cachedCourses || fetchedCourses || [];

    // Fetch all courses from API when cache is cold and user starts typing
    const ensureCoursesLoaded = useCallback(async () => {
        if (cachedCourses || fetchedCourses || isFetching) return;
        setIsFetching(true);
        try {
            const { data } = await api.get('/courses');
            const courses = data.courses || [];
            setFetchedCourses(courses);
            // Also populate the query cache so Dashboard benefits too
            queryClient.setQueryData(['courses'], courses);
        } catch (_) {
            setFetchedCourses([]);
        } finally {
            setIsFetching(false);
        }
    }, [cachedCourses, fetchedCourses, isFetching, queryClient]);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setOpen(true);
        // Debounce the fetch trigger so we don't fire immediately on every keystroke
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (val.trim()) ensureCoursesLoaded();
        }, 300);
    };

    const results = query.trim().length === 0
        ? []
        : allCourses.filter(c =>
            c.title?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6);

    const showDropdown = open && focused && query.trim().length > 0;

    const handleSelect = useCallback((course) => {
        setQuery('');
        setOpen(false);
        navigate(`/courses/${course._id}`);
    }, [navigate]);

    const handleKeyDown = (e) => {
        if (!showDropdown) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted(h => Math.min(h + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted(h => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[highlighted]) handleSelect(results[highlighted]);
        } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
        }
    };

    // Reset highlight when results change
    useEffect(() => { setHighlighted(0); }, [results.length]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => () => clearTimeout(debounceRef.current), []);

    return (
        <div id="tour-search" ref={containerRef} className="relative flex-1 max-w-md hidden md:block">

            <div className={`flex items-center gap-2 bg-surface-2 border rounded-lg px-3 h-10 text-sm transition-colors ${focused ? 'border-primary' : 'border-border hover:border-text-muted'}`}>
                {isFetching
                    ? <Loader2 className="w-4 h-4 shrink-0 text-primary animate-spin" />
                    : <Search className="w-4 h-4 shrink-0 text-text-muted" />
                }
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => { setFocused(true); setOpen(true); if (query.trim()) ensureCoursesLoaded(); }}
                    onBlur={() => setFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search courses…"
                    className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-muted min-w-0"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Search courses"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                />
                {query && (
                    <button
                        onMouseDown={e => { e.preventDefault(); setQuery(''); setOpen(false); }}
                        className="text-text-muted hover:text-text-primary transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
                    {isFetching ? (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted">
                            <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
                            Loading courses…
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted">
                            <BookOpen className="w-4 h-4 shrink-0" />
                            No courses match "{query}"
                        </div>
                    ) : (
                        <ul role="listbox">
                            {results.map((course, i) => {
                                const thumb = course?.thumbnailUrl || course?.sections?.[0]?.lectures?.[0]?.thumbnailUrl;
                                return (
                                    <li
                                        key={course._id}
                                        role="option"
                                        aria-selected={i === highlighted}
                                        onMouseDown={e => { e.preventDefault(); handleSelect(course); }}
                                        onMouseEnter={() => setHighlighted(i)}
                                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${i === highlighted ? 'bg-surface-2' : 'hover:bg-surface-2'}`}
                                    >
                                        <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-border bg-surface-2 flex items-center justify-center">
                                            {thumb
                                                ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                                                : <BookOpen className="w-4 h-4 text-text-muted" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-text-primary truncate">{course.title}</p>
                                            <p className="text-xs text-text-muted">{course.totalLectures || 0} lectures</p>
                                        </div>
                                        <Search className="w-3 h-3 text-text-muted shrink-0" />
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── NavBar ──────────────────────────────────────────────────────────── */
const NavBar = () => {
    const { user } = useAuthStore();
    const { totalXP, level, setProfile } = useGamificationStore();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    const [mobileOpen, setMobileOpen] = useState(false);


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
                    <img src="/logo.png" alt="QuestXP" className="w-9 h-9 object-contain" />
                    <span className="text-lg font-semibold tracking-tight text-text-primary">
                        QuestXP
                    </span>
                </Link>

                {/* Live search */}
                <div className="flex flex-1 items-center gap-2">
                    <CourseSearch />
                    <a 
                        href="https://www.youtube.com/feed/playlists"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-glass hidden sm:flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-bold transition-all hover:bg-surface-3 group border border-border whitespace-nowrap"
                    >
                        <Star className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span className="hidden lg:inline">Explore more courses</span>
                        <span className="lg:hidden">Explore more</span>
                    </a>
                </div>

                <div className="flex-1" />

                <nav className="hidden md:flex items-center gap-1 mr-2">
                    <Link to="/" className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        Home
                    </Link>
                    <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        My Courses
                    </Link>
                    <Link id="tour-roadmap" to="/roadmap" className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        Roadmap
                    </Link>

                </nav>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
                        <Zap className="w-4 h-4 text-gold" />
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


                <Link to="/profile" className="relative flex items-center gap-2 group">
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
                                to="/" 
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text-primary"
                            >
                                <img src="/favicon.png" alt="" className="w-6 h-6 object-contain" />
                                Home
                            </Link>
                            <Link 
                                to="/dashboard" 
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text-primary"
                            >
                                <Zap className="w-5 h-5 text-warning" />
                                Courses
                            </Link>
                            <Link 
                                to="/roadmap" 
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text-primary"
                            >
                                <Layout className="w-5 h-5 text-primary" />
                                Roadmap
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
                        <div className="p-4 rounded-xl bg-surface-2 border border-border flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Mastery</span>
                                <span className="text-xl font-black text-text-primary">{(totalXP || user?.totalXP || 0).toLocaleString()} XP</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                                <Zap className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default NavBar;
