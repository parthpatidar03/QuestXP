import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Sun,
    Moon,
    Menu,
    X,
    CheckCircle2,
    Sparkles,
    Trophy,
    ShieldCheck,
    Bell,
    Map,
    Play,
    ListChecks,
    Flame,
} from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import VideoModal from '../components/VideoModal';

import Footer from '../components/ui/Footer';
import LeaderboardPodium from '../components/Dashboard/LeaderboardPodium';
import FeaturesStack from '../components/Landing/FeaturesStack';
import useAuthStore from '../store/useAuthStore';
import { ShinyCard } from '../components/ui/ShinyCard';
import Counter from '../components/ui/Counter';
import Marquee from '../components/animata/container/marquee';
import Reveal from '../components/ui/Reveal';

// Conservative floor values — always shown if API fails or is slow.
const FALLBACK_STATS = {
    learners: { value: 100, raw: 102, show: true },
    missions: { value: 500, raw: 520, show: true },
    xp:       { value: 30000, raw: 31000, show: true },
    visits:   { value: 1000, raw: 1050, show: true },
};

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuthStore();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);
    const [heroUrl, setHeroUrl] = useState('');
    // Stats loaded from /api/public/stats. Fallback ensures metrics bar
    // is ALWAYS visible — API data overwrites on success.
    const [stats, setStats] = useState(FALLBACK_STATS);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get(`/public/stats?t=${Date.now()}`);
                setStats(data);
            } catch (_err) {
                // Silent fail — stats section just won't render
            }
        };
        fetchStats();
    }, []);

    const formatMetric = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k+';
        return Math.floor(num) + '+';
    };

    // Build the metrics list dynamically — we only render entries with show:true.
    // This avoids displaying "5+ Active Learners" before the product has scale.
    const visibleMetrics = stats
        ? [
            { key: 'learners', label: ['Active', 'Learners'],          color: 'text-primary',      stat: stats.learners },
            { key: 'missions', label: ['Missions', 'Finished'],        color: 'text-text-primary', stat: stats.missions },
            { key: 'xp',       label: ['Knowledge', 'XP Distributed'], color: 'text-text-primary', stat: stats.xp },
            { key: 'visits',   label: ['Global', 'Interactions'],      color: 'text-text-primary', stat: stats.visits },
        ].filter(m => m.stat?.show && m.stat?.value > 0)
        : [];


    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'light';
        const nextDark = theme === 'dark';
        setIsDark(nextDark);
        if (nextDark) document.documentElement.classList?.add('dark');
        else document.documentElement.classList?.remove('dark');
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList?.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList?.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const openApp = () => {
        setMobileMenuOpen(false);
        navigate('/dashboard');
    };

    const openAuth = () => {
        setMobileMenuOpen(false);
        navigate(isAuthenticated ? '/dashboard' : '/login');
    };

    const handleHeroSubmit = () => {
        if (!heroUrl.trim()) {
            openApp();
            return;
        }
        const encoded = encodeURIComponent(heroUrl);
        if (isAuthenticated && !isLoading) {
            navigate(`/dashboard?createUrl=${encoded}`);
        } else {
            navigate(`/dashboard?demo=true&createUrl=${encoded}`);
        }
    };

    const studyEmojis1 = [
        { emoji: "📚", position: "md:-left-12 -left-6 md:-top-8 -top-6 group-hover/hero:-translate-y-4 group-hover/hero:-translate-x-4 group-hover/hero:-rotate-12" },
        { emoji: "🎓", position: "md:-left-10 -left-4 md:-bottom-8 -bottom-6 group-hover/hero:translate-y-4 group-hover/hero:-translate-x-4 group-hover/hero:rotate-12" },
        { emoji: "💡", position: "md:-right-8 -right-4 md:-top-10 -top-8 group-hover/hero:-translate-y-4 group-hover/hero:translate-x-4 group-hover/hero:scale-110" },
        { emoji: "✏️", position: "md:-right-12 -right-6 md:-bottom-8 -bottom-6 group-hover/hero:translate-y-4 group-hover/hero:translate-x-4 group-hover/hero:rotate-45" },
    ];

    const studyEmojis2 = [
        { emoji: "💻", position: "md:-left-12 -left-6 md:-top-8 -top-6 group-hover/hero:-translate-y-4 group-hover/hero:-translate-x-4 group-hover/hero:-rotate-12" },
        { emoji: "🎯", position: "md:-left-10 -left-4 md:-bottom-8 -bottom-6 group-hover/hero:translate-y-4 group-hover/hero:-translate-x-4 group-hover/hero:rotate-12" },
        { emoji: "🚀", position: "md:-right-8 -right-4 md:-top-10 -top-8 group-hover/hero:-translate-y-4 group-hover/hero:translate-x-4 group-hover/hero:rotate-12" },
        { emoji: "🧠", position: "md:-right-12 -right-6 md:-bottom-8 -bottom-6 group-hover/hero:translate-y-4 group-hover/hero:translate-x-4 group-hover/hero:-rotate-12" },
    ];

    return (
        <div className="min-h-screen bg-bg relative flex flex-col">
            <Helmet>
                <title>QuestXP — Gamified Learning from YouTube Playlists | AI Quizzes, XP, Streaks</title>
                <meta name="description" content="QuestXP turns any YouTube playlist into a structured course with AI-generated quizzes, notes, and study roadmaps. Earn XP, level up, build streaks, and learn with friends in private squads." />
                <meta name="keywords" content="QuestXP, gamified learning, YouTube to course, AI study assistant, study roadmap, XP, study streak, learning platform India, AI quiz generator, coding roadmap" />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
                <meta name="author" content="Parth Patidar" />
                <link rel="canonical" href="https://questxp.in/" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="QuestXP" />
                <meta property="og:url" content="https://questxp.in/" />
                <meta property="og:title" content="QuestXP — Gamified Learning from YouTube Playlists" />
                <meta property="og:description" content="Turn any YouTube playlist into a structured course with AI quizzes, notes, and a study roadmap. Earn XP and level up." />
                <meta property="og:image" content="https://questxp.in/og-image.png" />
                <meta property="og:image:alt" content="QuestXP — A gamified learning dashboard" />
                <meta property="og:locale" content="en_IN" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://questxp.in/" />
                <meta name="twitter:title" content="QuestXP — Gamified Learning from YouTube Playlists" />
                <meta name="twitter:description" content="AI quizzes, structured roadmaps, XP & streaks. Built for serious self-learners in India." />
                <meta name="twitter:image" content="https://questxp.in/og-image.png" />

                {/* Structured data — gives Google rich-result eligibility. */}
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'SoftwareApplication',
                    'name': 'QuestXP',
                    'applicationCategory': 'EducationalApplication',
                    'operatingSystem': 'Web',
                    'url': 'https://questxp.in/',
                    'description': 'Gamified learning platform that converts YouTube playlists into structured courses with AI-generated quizzes, notes, and study roadmaps.',
                    'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'INR' },
                    'creator': {
                        '@type': 'Person',
                        'name': 'Parth Patidar',
                        'url': 'https://www.linkedin.com/in/patidar-parth/',
                    },
                })}</script>
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    'name': 'QuestXP',
                    'url': 'https://questxp.in/',
                    'logo': 'https://questxp.in/favicon.png',
                    'sameAs': [
                        'https://www.linkedin.com/in/patidar-parth/',
                        'https://github.com/parthpatidar03',
                    ],
                })}</script>
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    'url': 'https://questxp.in/',
                    'name': 'QuestXP',
                    'potentialAction': {
                        '@type': 'SearchAction',
                        'target': 'https://questxp.in/?q={search_term_string}',
                        'query-input': 'required name=search_term_string',
                    },
                })}</script>
            </Helmet>

            <header className="sticky top-0 z-50 w-full px-3 sm:px-5 pt-3 pb-1">
                <div className="max-w-screen-xl mx-auto clay rounded-clay-lg px-3 sm:px-5 h-16 flex items-center justify-between gap-4">
                    <Link to="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
                        <img src="/logo-mark.webp" alt="" width={96} height={96} className="w-9 h-9 object-contain transition-transform duration-200 ease-clay group-hover:scale-105" />
                        <span className="text-lg font-display font-bold text-text-primary">QuestXP</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {[
                            { href: '#how-it-works', label: 'How it works' },
                            { href: '#features', label: 'Features' },
                        ].map(l => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="px-4 h-10 flex items-center rounded-clay text-sm font-bold text-text-secondary hover:text-text-primary hover:clay-sm hover:-translate-y-[2px] transition-all duration-200 ease-clay whitespace-nowrap"
                            >
                                {l.label}
                            </a>
                        ))}
                        <button
                            onClick={() => setFeedbackOpen(true)}
                            className="px-4 h-10 flex items-center rounded-clay text-sm font-bold text-text-secondary hover:text-text-primary hover:clay-sm hover:-translate-y-[2px] transition-all duration-200 ease-clay whitespace-nowrap"
                        >
                            Feedback
                        </button>
                    </nav>

                    <div className="hidden md:flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="clay-sm clay-interactive w-10 h-10 flex items-center justify-center rounded-clay text-text-secondary hover:text-text-primary"
                            title="Toggle theme"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => navigate('/dashboard?demo=true')}
                            className="clay-sm clay-interactive px-4 h-11 rounded-clay flex items-center gap-2 whitespace-nowrap"
                        >
                            <span className="text-sm font-bold text-text-primary">Try demo</span>
                            <span className="clay-sunk-sm px-2 py-0.5 rounded-full text-[10px] text-text-muted font-bold uppercase tracking-wider">No sign-in</span>
                        </button>
                        <button onClick={openAuth} className="clay-sm clay-interactive px-5 h-11 rounded-clay text-sm font-bold text-text-primary whitespace-nowrap">
                            {isAuthenticated && !isLoading ? 'Dashboard' : 'Sign in'}
                        </button>
                        <button onClick={openApp} className="btn-primary whitespace-nowrap">
                            Get Started
                        </button>
                    </div>

                    <div className="md:hidden flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="clay-sm clay-interactive w-11 h-11 flex items-center justify-center rounded-clay text-text-secondary"
                            title="Toggle theme"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            className="clay-sm clay-interactive w-11 h-11 flex items-center justify-center rounded-clay text-text-secondary"
                            aria-label="Toggle menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden max-w-screen-xl mx-auto mt-3 clay rounded-clay-lg p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex flex-col gap-2.5">
                            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="clay-sm clay-interactive px-4 min-h-[48px] flex items-center rounded-clay text-sm font-bold text-text-primary">How it works</a>
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="clay-sm clay-interactive px-4 min-h-[48px] flex items-center rounded-clay text-sm font-bold text-text-primary">Features</a>
                            <button
                                onClick={() => { setMobileMenuOpen(false); setFeedbackOpen(true); }}
                                className="clay-sm clay-interactive px-4 min-h-[48px] flex items-center rounded-clay text-left text-sm font-bold text-text-primary"
                            >
                                Feedback
                            </button>
                            <button
                                onClick={() => { setMobileMenuOpen(false); navigate('/dashboard?demo=true'); }}
                                className="clay-sm clay-interactive px-4 min-h-[48px] flex items-center justify-between rounded-clay"
                            >
                                <span className="text-sm font-bold text-text-primary">Try demo</span>
                                <span className="clay-sunk-sm px-2 py-0.5 rounded-full text-[10px] text-text-muted font-bold uppercase tracking-wider">No sign-in</span>
                            </button>
                            <button onClick={openAuth} className="clay-sm clay-interactive px-4 min-h-[48px] flex items-center justify-center rounded-clay text-sm font-bold text-text-primary">
                                {isAuthenticated && !isLoading ? 'Dashboard' : 'Sign in'}
                            </button>
                            <button onClick={openApp} className="btn-primary w-full">Get Started</button>
                        </div>
                    </div>
                )}
            </header>

            <main className="relative z-10 flex-1">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section id="how-it-works" className="relative max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 flex flex-col items-center text-center">

                    {/* Floating Doodles */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-[4%] top-[12%] hidden lg:flex w-16 h-16 rounded-clay-lg clay items-center justify-center text-primary"
                    >
                        <Play className="w-6 h-6" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [15, -15, 15] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute right-[5%] top-[20%] hidden lg:flex w-16 h-16 rounded-clay-lg clay items-center justify-center text-gold"
                    >
                        <Trophy className="w-6 h-6" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [-5, 15, -5] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-[9%] bottom-[26%] hidden xl:flex w-14 h-14 rounded-clay-lg clay items-center justify-center text-warning"
                    >
                        <Flame className="w-5 h-5" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [10, -10, 10] }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute right-[8%] bottom-[22%] hidden xl:flex w-14 h-14 rounded-clay-lg clay items-center justify-center text-success"
                    >
                        <ListChecks className="w-5 h-5" />
                    </motion.div>

                    <Reveal
                        y={20}
                        duration={0.8}
                        className="flex flex-col items-center max-w-4xl relative z-10"
                    >
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-text-primary leading-[1.08] tracking-tight mb-6">
                            Turn{" "}
                            <svg
                                role="img"
                                aria-label="YouTube"
                                viewBox="0 0 24 24"
                                className="inline-block w-[1.15em] h-[1.15em] mx-1.5 -mt-2 align-middle"
                            >
                                <title>YouTube</title>
                                <path
                                    fill="#FF0000"
                                    d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z"
                                />
                                <path fill="#FFFFFF" d="M9.6 15.6 15.8 12 9.6 8.4z" />
                            </svg>{" "}
                            playlists into{" "}
                            <span className="group/hero relative inline-flex items-center cursor-pointer">
                                <span className="text-gold-dim underline decoration-dashed decoration-2 underline-offset-8 decoration-gold/40 transition-all duration-300 group-hover/hero:decoration-gold/80">courses</span>
                                <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/hero:opacity-100 pointer-events-none z-20">
                                    {studyEmojis1.map((dest, index) => (
                                        <span key={index} className={`absolute transform text-2xl sm:text-3xl md:text-5xl transition-transform duration-300 ease-clay ${dest.position}`}>
                                            {dest.emoji}
                                        </span>
                                    ))}
                                </span>
                            </span>{" "}
                            you can{" "}
                            <span className="group/hero relative inline-flex items-center cursor-pointer">
                                <span className="text-primary underline decoration-dashed decoration-2 underline-offset-8 decoration-primary/40 transition-all duration-300 group-hover/hero:decoration-primary/80">actually finish.</span>
                                <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/hero:opacity-100 pointer-events-none z-20">
                                    {studyEmojis2.map((dest, index) => (
                                        <span key={index} className={`absolute transform text-2xl sm:text-3xl md:text-5xl transition-transform duration-300 ease-clay ${dest.position}`}>
                                            {dest.emoji}
                                        </span>
                                    ))}
                                </span>
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-text-secondary font-semibold leading-relaxed max-w-[46ch] mb-9">
                            YouTube has the content. QuestXP gives it the{' '}
                            <span className="text-primary-hover dark:text-primary">structure, gamification, and personalization</span> you need to finish.
                        </p>

                        <div className="clay-sunk flex flex-col sm:flex-row gap-2 p-2 rounded-clay-lg w-full max-w-lg">
                            <input
                                type="text"
                                value={heroUrl}
                                onChange={(e) => setHeroUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleHeroSubmit()}
                                placeholder="Paste YouTube Playlist URL"
                                aria-label="YouTube playlist URL"
                                className="flex-1 min-h-[48px] px-5 bg-transparent border-0 text-text-primary font-semibold placeholder:text-text-muted focus:outline-none"
                            />
                            <button onClick={handleHeroSubmit} className="btn-primary shrink-0">
                                Get Started
                            </button>
                        </div>
                        <p className="text-xs font-semibold text-text-muted mt-3">Free — no card, no sign-in to try.</p>
                    </Reveal>

                    {/* The product itself, sitting in a clay frame */}
                    <Reveal
                        y={30}
                        duration={1.0}
                        delay={0.2}
                        scale={0.97}
                        className="w-full mt-14 max-w-6xl"
                    >
                        <div className="relative clay rounded-clay-xl p-2 sm:p-3">
                            <img
                                src="/Images/dashboard_landing_page.webp"
                                alt="The QuestXP dashboard: today's mission, streak, rank and course progress"
                                width={1600}
                                height={1044}
                                fetchPriority="high"
                                className="w-full h-auto object-cover block rounded-clay-lg"
                            />
                        </div>
                    </Reveal>
                </section>

                {/* ── Numbers ──────────────────────────────────────────── */}
                {visibleMetrics.length > 0 && (
                    <section className="py-10">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6">
                            <div className="clay rounded-clay-xl p-6 sm:p-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {visibleMetrics.map((m) => (
                                        <div
                                            key={m.key}
                                            className="clay-sunk rounded-clay-lg flex flex-col items-center justify-center text-center p-5"
                                        >
                                            <Counter
                                                targetValue={m.stat.value}
                                                format={formatMetric}
                                                className={`text-3xl sm:text-4xl font-mono font-bold ${m.color} mb-2`}
                                            />
                                            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.15em] leading-tight">
                                                {m.label[0]} <br/> {m.label[1]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Multiple playlists → single course ───────────────── */}
                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
                    <div className="relative clay rounded-clay-xl py-14 px-6 flex flex-col items-center justify-center">
                        <Reveal y={30} className="text-center relative z-10">
                            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-text-muted block mb-5">Synergized Learning</span>

                            <div className="flex flex-col items-center">
                                <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight text-text-primary leading-[0.95]">
                                    MULTIPLE <span className="text-primary">PLAYLISTS</span>
                                </h2>
                                <div className="flex items-center gap-3 my-5">
                                    <div className="h-[3px] w-10 sm:w-20 rounded-full clay-sunk-sm" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    <div className="h-[3px] w-10 sm:w-20 rounded-full clay-sunk-sm" />
                                </div>
                                <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight text-text-primary leading-[0.95]">
                                    SINGLE COURSE
                                </h2>
                            </div>

                            <p className="text-sm font-semibold text-text-muted mt-8">
                                The definitive workspace for technical mastery.
                            </p>
                        </Reveal>
                    </div>
                </section>

                {/* ── Leaderboard ──────────────────────────────────────── */}
                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
                    <Reveal y={30} className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3">
                            Global Hall of Fame
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto text-base sm:text-lg">
                            Compete with learners worldwide and earn XP for every mission you finish.
                        </p>
                    </Reveal>

                    <Reveal y={40} className="relative">
                        <LeaderboardPodium
                            players={[
                                { name: 'Alex_Mastery', totalXP: 12450, level: 12 },
                                { name: 'Quantum_Learner', totalXP: 10200, level: 10 },
                                { name: 'Deep_Focus', totalXP: 9850, level: 9 },
                            ]}
                        />

                        <div className="mt-12 text-center">
                            <button onClick={openApp} className="btn-primary mx-auto">
                                View Full Leaderboard
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </Reveal>
                </section>


                {/* ── Roadmaps ─────────────────────────────────────────── */}
                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <Reveal y={30}>
                            <div className="clay-sunk-sm inline-flex items-center gap-2 px-3.5 py-2 rounded-full mb-6 text-xs font-bold text-primary uppercase tracking-widest">
                                <Map className="w-4 h-4" />
                                Interactive Learning paths
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-display font-bold text-text-primary mb-6 leading-[1.1]">
                                Master Any Subject with <span className="text-primary">Dynamic Roadmaps</span>
                            </h2>
                            <p className="text-text-secondary text-lg leading-relaxed mb-8">
                                Visual learning paths that keep you on track. Transform complex topics into
                                structured modules and master anything faster.
                            </p>

                            <ul className="space-y-3">
                                {[
                                    "Visual progress tracking for every milestone",
                                    "AI-generated curriculum based on your goals",
                                    "Sequential module locks to ensure fundamentals first",
                                ].map((text) => (
                                    <li key={text} className="clay-sunk flex items-center gap-3 p-3.5 rounded-clay text-text-secondary font-semibold">
                                        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </Reveal>

                        <Reveal y={40} scale={0.96} className="relative">
                            <div className="clay rounded-clay-xl p-2.5">
                                <img
                                    src="/Images/Roadmap_landingpage.webp"
                                    alt="The QuestXP roadmap planner"
                                    width={1600}
                                    height={1089}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-auto object-cover block rounded-clay-lg"
                                />
                            </div>

                            {/* Decorative Badge */}
                            <div className="clay absolute -bottom-6 -left-4 sm:-left-6 z-20 p-4 rounded-clay-lg hidden sm:flex items-center gap-3 clay-bob">
                                <div className="clay-sunk w-10 h-10 rounded-clay flex items-center justify-center text-success">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Level Progress</p>
                                    <p className="text-sm font-mono font-bold text-text-primary">85% Completed</p>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ── Focus Guardian ───────────────────────────────────── */}
                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <Reveal y={30} className="lg:order-2">
                            <div className="clay-sunk-sm inline-flex items-center gap-2 px-3.5 py-2 rounded-full mb-6 text-xs font-bold text-danger uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" />
                                Anti-Distraction Engine
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-display font-bold text-text-primary mb-6 leading-[1.1]">
                                Your Proactive <span className="text-primary">Focus Guardian</span>
                            </h2>
                            <p className="text-text-secondary text-lg leading-relaxed mb-8">
                                Don&apos;t fall into the distraction trap. Our Guardian detects when you drift away
                                and sends a personalized nudge to keep you on mission.
                            </p>

                            <div className="clay-sunk relative p-5 rounded-clay-lg">
                                <div className="flex items-start gap-4">
                                    <div className="clay-sm w-11 h-11 rounded-clay flex items-center justify-center shrink-0 text-primary">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-primary mb-1">Smart Alert Example</p>
                                        <p className="text-base text-text-secondary font-semibold">
                                            &quot;Hey, you opening reels again instead of studying? 👀&quot;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        <Reveal y={40} scale={0.96} className="relative lg:order-1">
                            <div className="clay rounded-clay-xl p-2.5">
                                <img
                                    src="/Images/notifications-questxp.webp"
                                    alt="QuestXP focus notification on a phone"
                                    width={1084}
                                    height={1183}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-auto rounded-clay-lg block"
                                />
                            </div>

                            {/* Floating Badge */}
                            <div className="clay absolute -bottom-6 -right-3 sm:-right-6 p-4 rounded-clay-lg flex items-center gap-3 z-20 clay-bob">
                                <img src="/logo-mark.webp" alt="" className="w-8 h-8 object-contain" />
                                <span className="text-xs font-bold text-text-primary">Focus Safeguard Active</span>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ── Mobile ───────────────────────────────────────────── */}
                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
                    <div className="clay rounded-clay-xl p-8 sm:p-12 grid lg:grid-cols-2 gap-10 items-center">
                        <Reveal y={30}>
                            <div className="clay-sunk-sm inline-flex items-center gap-2 px-3.5 py-2 rounded-full mb-6 text-xs font-bold text-primary uppercase tracking-widest">
                                <Sparkles className="w-4 h-4" />
                                Study anywhere
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-4 leading-[1.1]">
                                The same quest line, in your pocket
                            </h2>
                            <p className="text-text-secondary text-lg leading-relaxed">
                                Every screen is built for the phone first — edge-to-edge player, tappable missions,
                                and the AI doubt tutor one tab away.
                            </p>
                        </Reveal>
                        <Reveal y={40} scale={0.96} className="flex justify-center">
                            <div className="clay rounded-clay-xl p-2 max-w-[280px]">
                                <img
                                    src="/Images/dashboard_mobile.webp"
                                    alt="QuestXP dashboard on a phone"
                                    width={640}
                                    height={1329}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-auto rounded-clay-lg block"
                                />
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ── Features ─────────────────────────────────────────── */}
                <section id="features" className="max-w-screen-xl mx-auto px-4 sm:px-6 py-16">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3">
                            Deep Learning Features
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto text-base sm:text-lg">
                            QuestXP provides the tools to transform video content into actionable knowledge.
                        </p>
                    </div>

                    <div className="flex justify-center w-full">
                        <FeaturesStack />
                    </div>
                </section>

                {/* ── Testimonials ─────────────────────────────────────── */}
                <section className="py-16 overflow-hidden group/testimonial">
                    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 mb-10">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <span className="text-primary-hover dark:text-primary font-bold text-[11px] uppercase tracking-[0.3em]">Wall of Love</span>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">What learners say</h2>
                        </div>
                    </div>

                    <div className="relative mx-auto px-4 sm:px-6 w-full max-w-[100vw] overflow-hidden">
                        <Marquee pauseOnHover className="[--duration:40s]" repeat={4}>
                            {[
                                { name: 'sarah01', text: 'QuestXP stops me from doom-scrolling. I open the app, watch my playlist, and actually learn.' },
                                { name: 'jamesdev', text: 'The notes feature linked to timestamps is a game changer. I can jump back to exactly where I got confused.' },
                                { name: 'ruchii', text: 'I use this for my anatomy lecture playlists. Turning them into a course makes studying so much less overwhelming.' },
                                { name: 'mk_codes', text: 'Cleanest learning experience I\'ve found. No distractions, just the content I need.' },
                                { name: 'aditya.s', text: 'Being able to see my progress visually is surprisingly motivating. Love the minimal design.' },
                                { name: 'alok7', text: 'Finally finished a 12-hour React course. The progress tracking is the only reason I didn\'t quit halfway.' },
                            ].map((t, idx) => (
                                <ShinyCard
                                    key={idx}
                                    className="clay clay-interactive p-7 rounded-clay-lg group/card w-[280px] md:w-[320px] aspect-square flex flex-col justify-between shrink-0 mx-3"
                                >
                                    <div className="absolute top-0 right-0 p-5 opacity-20 group-hover/card:opacity-40 transition-opacity">
                                        <Sparkles className="w-7 h-7 text-primary" />
                                    </div>
                                    <p className="text-text-primary text-base font-semibold leading-relaxed mb-8 relative z-10">
                                        &quot;{t.text}&quot;
                                    </p>
                                    <div className="flex items-center gap-3.5 relative z-10 mt-auto">
                                        <div className="w-12 h-12 rounded-clay flex items-center justify-center text-white font-display font-bold text-xl clay-pop-sm"
                                             style={{ background: 'linear-gradient(150deg, var(--color-primary), var(--color-primary-hover))' }}>
                                            {t.name[0].toUpperCase()}
                                        </div>
                                        <p className="text-sm font-bold text-text-primary">@{t.name}</p>
                                    </div>
                                </ShinyCard>
                            ))}
                        </Marquee>
                    </div>
                </section>

                {/* ── Final CTA ────────────────────────────────────────── */}
                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-8">
                    <div className="clay rounded-clay-xl p-10 sm:p-14 text-center">
                        <h2 className="text-3xl sm:text-5xl font-display font-bold text-text-primary mb-4 max-w-[20ch] mx-auto leading-[1.1]">
                            Paste a playlist. Get your first quest.
                        </h2>
                        <p className="text-text-secondary text-lg max-w-[46ch] mx-auto mb-8">
                            Free while the content is free. The structure is the product.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button onClick={openApp} className="btn-primary">
                                Get Started
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => navigate('/dashboard?demo=true')}
                                className="clay-sm clay-interactive px-6 min-h-[44px] rounded-clay text-sm font-bold text-text-primary"
                            >
                                Try the demo first
                            </button>
                        </div>
                    </div>
                </section>

            </main>

            <Footer onOpenFeedback={() => setFeedbackOpen(true)} />
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} contextPage="Landing Page" />
            <VideoModal
                isOpen={videoOpen}
                onClose={() => setVideoOpen(false)}
                videoUrl="https://vimeo.com/1191279081?share=copy&fl=sv&fe=ci#t=0"
            />
        </div>
    );
};


export default LandingPage;
