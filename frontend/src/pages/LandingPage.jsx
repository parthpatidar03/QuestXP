import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Flame,
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
} from 'lucide-react';
import { BGPattern } from '../components/ui/bg-pattern';
import FeedbackModal from '../components/FeedbackModal';
import VideoModal from '../components/VideoModal';
import { Play } from 'lucide-react';
import Footer from '../components/ui/Footer';
import LeaderboardPodium from '../components/Dashboard/LeaderboardPodium';
import FeaturesStack from '../components/Landing/FeaturesStack';
import useAuthStore from '../store/useAuthStore';
import { ShinyCard } from '../components/UI/ShinyCard';


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
    // Stats loaded from /api/public/stats. Fallback ensures metrics bar
    // is ALWAYS visible — API data overwrites on success.
    const [stats, setStats] = useState(FALLBACK_STATS);
    // Removed high-frequency mouse tracking state and listeners for performance

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get(`/public/stats?t=${Date.now()}`);
                setStats(data);
            } catch (err) {
                // Silent fail — stats section just won't render
            }
        };
        fetchStats();
    }, []);

    const formatMetric = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k+`;
        return `${num}+`;
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
        const theme = localStorage.getItem('theme') || 'dark';
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



    return (
        <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col">
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
            {/* Interactive Spotlight Removed for Performance */}
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-20 z-0" />

            <header className="relative z-20 border-b border-border bg-surface/90">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                    <Link to="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
                        <img src="/favicon.png" alt="QuestXP" className="w-10 h-10 object-contain transition-transform group-hover:scale-105 rounded-xl shadow-sm" />
                        <span className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">QuestXP</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 text-sm">
                        <a href="#features" className="px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">Features</a>
                        <a href="#how-it-works" className="px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">How it works</a>
                        <button 
                            onClick={() => setFeedbackOpen(true)}
                            className="px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                        >
                            Feedback
                        </button>
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
                        <button 
                            onClick={() => navigate('/dashboard?demo=true')} 
                            className="flex flex-col items-center px-4 py-1.5 rounded-xl border border-border hover:border-primary/50 hover:bg-surface-2 transition-all group"
                        >
                            <span className="text-sm font-bold text-text-secondary group-hover:text-text-primary leading-none">Try Demo</span>
                            <span className="text-[8px] text-text-muted uppercase tracking-tighter mt-1 font-black opacity-60">Without Sign-in</span>
                        </button>
                        <button onClick={openAuth} className="bg-red-600 text-sm px-6 py-2.5 rounded-lg text-white font-bold transition-all hover:bg-red-700 hover:-translate-y-0.5 duration-150">
                            {isAuthenticated && !isLoading ? 'Dashboard' : 'Sign in'}
                        </button>
                        <button onClick={openApp} className="btn-primary text-sm px-6 py-2.5 hover:-translate-y-0.5 duration-150">
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
                            <button 
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    setFeedbackOpen(true);
                                }} 
                                className="px-3 py-2 rounded-lg text-left text-sm text-text-secondary hover:bg-surface-2"
                            >
                                Feedback
                            </button>
                            <button 
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    navigate('/dashboard?demo=true');
                                }} 
                                className="flex flex-col items-start px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors"
                            >
                                <span className="text-sm font-bold text-text-secondary">Try Demo</span>
                                <span className="text-[8px] text-text-muted uppercase tracking-tighter mt-0.5 font-black opacity-60">Without Sign-in</span>
                            </button>
                            <button onClick={openAuth} className="mt-2 w-full py-3 rounded-lg bg-red-600 text-white font-bold text-center hover:bg-red-700 transition-colors">
                                {isAuthenticated && !isLoading ? 'Dashboard' : 'Sign in'}
                            </button>
                            <button onClick={openApp} className="mt-2 btn-primary w-full">Get Started</button>
                        </div>
                    </div>
                )}
            </header>

            <main className="relative z-10 flex-1">
                <section id="how-it-works" className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-8 sm:pb-10">
                    <div className="grid gap-10 lg:grid-cols-2 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface mb-6 text-xs sm:text-sm text-text-secondary">
                                <Flame className="w-4 h-4 text-primary" />
                                Serious learning workspace, with light gamification.
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary leading-[1.05] tracking-[-0.04em] max-w-[14ch] font-display">
                                Turn 
                                <img src="/yt-icon.png" alt="YouTube" className="inline-block w-[1.1em] h-[1.1em] mx-2 -mt-1 vertical-middle align-middle" /> 
                                playlists into courses you can actually finish.
                            </h1>

                            <p className="mt-8 text-lg sm:text-xl text-text-primary font-medium leading-relaxed max-w-[60ch]">
                                We buy expensive courses but end up on YouTube. It has the content, but lacks the 
                                <span className="text-primary italic font-bold"> structure, gamification, and personalization </span> 
                                you need to finish.
                                <span className="block mt-4 text-text-primary font-black tracking-tight">
                                    QuestXP combines multiple playlists from different creators into one structured course you can finish and track.
                                </span>
                            </p>

                            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
                                <button onClick={openApp} className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm sm:text-base active:scale-95 active:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all">
                                    Start Learning
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setVideoOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border border-border bg-surface text-sm sm:text-base font-bold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    Watch Demo
                                </button>
                            </div>

                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                            className="relative group"
                        >
                            {/* Decorative glow behind image */}
                            <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            <div className="relative z-10 w-full h-auto rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <img 
                                    src="/Images/dashboard_landing_page.png" 
                                    alt="QuestXP Dashboard" 
                                    className="w-full h-auto object-cover block"
                                />
                                
                                {/* Glass overlay on bottom */}
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Dashboard Preview</span>
                                    </div>
                                    <Sparkles className="w-4 h-4 text-primary" />
                                </div>

                                {/* Floating badge */}
                                <div className="absolute -top-4 -right-4 bg-surface-2 border border-border p-3 rounded-xl shadow-xl hidden md:flex items-center gap-3 z-20">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Flame className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Active Mission</p>
                                        <p className="text-xs font-black text-text-primary">Master ML in 6h</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {visibleMetrics.length > 0 && (
                    <section className="py-8 relative overflow-hidden">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6">
                            <div className="bg-surface/40 backdrop-blur-md border border-border rounded-[2.5rem] p-8 shadow-2xl relative group overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="grid relative z-10 grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-y-0">
                                    {visibleMetrics.map((m, idx) => (
                                        <div
                                            key={m.key}
                                            className="flex flex-col items-center justify-center text-center p-4 md:p-8 md:border-r border-border/20 md:last:border-r-0"
                                        >
                                            <p className={`text-3xl sm:text-5xl font-black ${m.color} font-display mb-2`}>
                                                {formatMetric(m.stat.value)}
                                            </p>
                                            <p className="text-[10px] sm:text-[10px] font-bold text-text-primary/80 dark:text-text-secondary uppercase tracking-[0.2em] leading-tight">
                                                {m.label[0]} <br/> {m.label[1]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
                                <div className="relative overflow-hidden bg-black rounded-[2.5rem] border border-white/10 py-12 px-6 flex flex-col items-center justify-center shadow-2xl">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,180,255,0.1),transparent_70%)]" />
                        
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center relative z-10 space-y-2"
                        >
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 block mb-4">Synergized Learning</span>
                            
                            <div className="flex flex-col items-center">
                                <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.06em] text-white leading-[0.9] font-display">
                                    MULTIPLE <span className="italic font-serif text-primary tracking-[-0.04em]">PLAYLISTS</span>
                                </h2>
                                <div className="flex items-center gap-3 my-4">
                                    <div className="h-[1px] w-8 sm:w-16 bg-white/10" />
                                    <span className="text-lg font-black text-white italic font-serif tracking-widest">•</span>
                                    <div className="h-[1px] w-8 sm:w-16 bg-white/10" />
                                </div>
                                <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.06em] text-white leading-[0.9] font-display">
                                    SINGLE COURSE
                                </h2>
                            </div>

                            <p className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase mt-8">
                                The definitive workspace for technical mastery.
                            </p>
                        </motion.div>
                    </div>
                </section>



                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-4">
                            Global Hall of Fame
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto text-base sm:text-lg">
                            Compete with learners worldwide and earn XP for every mission you finish.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />
                        <LeaderboardPodium 
                            players={[
                                { name: 'Alex_Mastery', totalXP: 12450, level: 12 },
                                { name: 'Quantum_Learner', totalXP: 10200, level: 10 },
                                { name: 'Deep_Focus', totalXP: 9850, level: 9 },
                            ]} 
                        />
                        
                        <div className="mt-12 text-center">
                            <button onClick={openApp} className="btn-primary px-8 py-4 text-sm font-black tracking-widest uppercase flex items-center gap-2 mx-auto hover:scale-105 transition-all">
                                View Full Leaderboard
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </section>


                {/* New Feature: Dynamic Roadmap */}
                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-6 text-xs font-bold text-primary uppercase tracking-widest">
                                <Map className="w-4 h-4" />
                                Interactive Learning paths
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-text-primary tracking-tight mb-8 leading-[1.1]">
                                Master Any Subject with <br/><span className="text-primary">Dynamic Roadmaps</span>
                            </h2>
                            <p className="text-text-secondary text-lg leading-relaxed mb-10">
                                Visual learning paths that keep you on track. Transform complex topics into 
                                structured modules and master anything faster.
                            </p>
                            
                            <ul className="space-y-4">
                                {[
                                    { icon: CheckCircle2, text: "Visual progress tracking for every milestone" },
                                    { icon: CheckCircle2, text: "AI-generated curriculum based on your goals" },
                                    { icon: CheckCircle2, text: "Sequential module locks to ensure fundamentals first" }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-text-secondary font-medium">
                                        <item.icon className="w-5 h-5 text-primary" />
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 w-full h-auto rounded-3xl border border-border shadow-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <img 
                                    src="/Images/Roadmap_landingpage.png" 
                                    alt="Dynamic Roadmap Feature" 
                                    className="w-full h-auto object-cover block"
                                />
                                
                                {/* Decorative Badge */}
                                <div className="absolute -bottom-6 -left-6 z-20 bg-surface border border-border p-4 rounded-2xl shadow-xl hidden sm:flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Level Progress</p>
                                        <p className="text-sm font-black text-text-primary">85% Completed</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-danger/30 bg-danger/10 mb-6 text-xs font-bold text-danger uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" />
                                Anti-Distraction Engine
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-text-primary tracking-tight mb-8 leading-[1.1]">
                                Your Proactive <br/><span className="text-primary">Focus Guardian</span>
                            </h2>
                            <p className="text-text-secondary text-lg leading-relaxed mb-10">
                                Don't fall into the distraction trap. Our Guardian detects when you drift away 
                                and sends a personalized nudge to keep you on mission.
                            </p>
                            
                            <div className="relative p-6 rounded-2xl bg-surface-2 border border-border overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bell className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-text-primary mb-1">Smart Alert Example</p>
                                        <p className="text-base text-text-secondary italic font-medium">
                                            "Hey, you opening reels again instead of studying? 👀"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute -inset-10 bg-primary/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 w-full rounded-3xl border border-border p-2 bg-bg shadow-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <img 
                                    src="/Images/notificatiions questXP.jpeg" 
                                    alt="QuestXP Focus Notification" 
                                    className="w-full h-auto rounded-2xl block"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                
                                {/* Floating Badge */}
                                <div className="absolute -bottom-6 -right-6 bg-surface-3 border border-border p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20">
                                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center p-1.5">
                                        <img src="/favicon.png" alt="" className="w-full h-full object-contain" />
                                    </div>
                                    <span className="text-xs font-black text-text-primary uppercase tracking-tighter">Focus Safeguard Active</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>


                <section id="features" className="max-w-screen-xl mx-auto px-4 sm:px-6 py-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-4">
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

                <section className="py-16 bg-surface/30 overflow-hidden group/testimonial">
                    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 mb-12">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">Wall of Love</span>
                            <h2 className="text-4xl font-black text-text-primary tracking-tight font-display">What learners say</h2>
                        </div>
                    </div>

                    <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
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
                                    className="p-8 rounded-3xl bg-surface-2/40 border border-border backdrop-blur-md hover:border-primary/50 hover:bg-surface-2/60 transition-all duration-300 group/card relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                        <Sparkles className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="text-text-primary text-base font-medium leading-relaxed mb-8 relative z-10">
                                        "{t.text}"
                                    </p>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl font-display">
                                            {t.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-text-primary tracking-tight">@{t.name}</h4>
                                        </div>
                                    </div>
                                </ShinyCard>
                            ))}
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
