import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    BookOpen,
    ChevronRight,
    Flame,
    Sun,
    Moon,
    Menu,
    X,
    CheckCircle2,
    Target,
    Sparkles,
} from 'lucide-react';
import { BGPattern } from '../components/ui/bg-pattern';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'dark';
        const nextDark = theme === 'dark';
        setIsDark(nextDark);
        if (nextDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const openApp = () => {
        setMobileMenuOpen(false);
        navigate('/dashboard');
    };

    const keyPoints = [
        'Convert any YouTube playlist into a structured course',
        'Track completion, XP, streaks, and milestones in one flow',
        'Generate notes, quizzes, and study plans from lecture content',
    ];

    return (
        <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-20 z-0" />

            <header className="relative z-20 border-b border-border bg-surface/90 backdrop-blur">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                    <Link to="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
                        <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center transition-transform group-hover:scale-105">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">QuestXP</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 text-sm">
                        <a href="#features" className="px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">Features</a>
                        <a href="#how-it-works" className="px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">How it works</a>
                    </nav>

                    <div className="hidden md:flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-lg border border-border bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
                            title="Toggle theme"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button onClick={openApp} className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">
                            Enter App
                        </button>
                        <button onClick={openApp} className="btn-primary text-sm px-4 py-2">
                            Get Started
                        </button>
                    </div>

                    <div className="md:hidden flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-lg border border-border bg-surface-2 text-text-secondary"
                            title="Toggle theme"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            className="p-2 rounded-lg border border-border bg-surface-2 text-text-secondary"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-border bg-surface px-4 sm:px-6 py-4">
                        <div className="flex flex-col gap-2">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-2">Features</a>
                            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-2">How it works</a>
                            <button onClick={openApp} className="mt-2 btn-primary w-full">Get Started</button>
                        </div>
                    </div>
                )}
            </header>

            <main className="relative z-10 flex-1">
                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10 sm:pb-14">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface mb-6 text-xs sm:text-sm text-text-secondary">
                                <Flame className="w-4 h-4 text-primary" />
                                Serious learning workspace, with light gamification.
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-text-primary leading-[1.08] tracking-tight max-w-[14ch]">
                                Turn playlists into courses you can actually finish.
                            </h1>

                            <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-[52ch]">
                                Convert YouTube playlists into structured courses, continue where you left off,
                                and stay consistent with progress tracking, AI notes, quizzes, and study plans.
                            </p>

                            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
                                <button onClick={openApp} className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base">
                                    Start Learning
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <a href="#features" className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-surface text-sm sm:text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">
                                    See Features
                                </a>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
                            className="glass-card p-4 sm:p-5"
                        >
                            <h2 className="text-sm font-semibold text-text-primary mb-4">Today at a glance</h2>
                            <div className="space-y-3">
                                {[
                                    { label: 'Current course', value: 'DSA in JavaScript' },
                                    { label: 'Progress', value: '61% complete' },
                                    { label: 'Next action', value: 'Finish Binary Trees lecture' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg border border-border bg-surface-2 px-3 py-3">
                                        <p className="text-xs text-text-muted">{item.label}</p>
                                        <p className="text-sm sm:text-base font-medium text-text-primary mt-1 break-words">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border text-xs sm:text-sm text-text-secondary">
                                Designed for focused study sessions, not noisy dashboards.
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section id="features" className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
                        {[
                            {
                                icon: <Target className="w-5 h-5" />,
                                title: 'Structured roadmap',
                                text: 'Playlist chaos becomes a clear sequence of sections, lectures, and milestones.',
                            },
                            {
                                icon: <Sparkles className="w-5 h-5" />,
                                title: 'AI study support',
                                text: 'Get notes, quizzes, and topic summaries generated from lecture context.',
                            },
                            {
                                icon: <CheckCircle2 className="w-5 h-5" />,
                                title: 'Progress that sticks',
                                text: 'Track completion, XP, and streaks with clear feedback and no clutter.',
                            },
                        ].map((feature) => (
                            <article key={feature.title} className="glass-card p-5 sm:p-6">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-primary/15 text-primary border border-primary/20">
                                    {feature.icon}
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                                <p className="text-sm text-text-secondary leading-relaxed">{feature.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="how-it-works" className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                    <div className="glass-card p-5 sm:p-6">
                        <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-4">How it works</h2>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                            {[
                                { step: '1', text: 'Paste a YouTube playlist' },
                                { step: '2', text: 'QuestXP builds your course structure' },
                                { step: '3', text: 'Study daily and track progress' },
                            ].map((item) => (
                                <div key={item.step} className="rounded-lg border border-border bg-surface-2 px-4 py-4">
                                    <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold mb-2">
                                        {item.step}
                                    </div>
                                    <p className="text-sm text-text-primary">{item.text}</p>
                                </div>
                            ))}
                        </div>
                        <ul className="mt-5 space-y-2 text-sm text-text-secondary">
                            {keyPoints.map(point => (
                                <li key={point} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </main>

            <footer className="relative z-10 border-t border-border bg-surface/85">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-text-primary">QuestXP</p>
                        <p className="text-xs text-text-muted mt-1">Learning platform first, game second.</p>
                        <p className="text-xs text-text-muted mt-1">Made by Parth Patidar with chai☕.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-text-secondary">
                        <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-text-primary transition-colors">How it works</a>
                        <button onClick={openApp} className="hover:text-text-primary transition-colors">Open App</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
