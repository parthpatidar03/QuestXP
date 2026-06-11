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
    Play,
    Zap,
    BookOpen,
    Users,
    Activity,
    Award
} from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import VideoModal from '../components/VideoModal';
import Footer from '../components/ui/Footer';
import LeaderboardPodium from '../components/Dashboard/LeaderboardPodium';
import useAuthStore from '../store/useAuthStore';

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
    const [isDark, setIsDark] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);
    
    // Stats loaded from /api/public/stats. Fallback ensures metrics bar
    // is ALWAYS visible — API data overwrites on success.
    const [stats, setStats] = useState(FALLBACK_STATS);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isClicked, setIsClicked] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        const handleMouseDown = () => setIsClicked(true);
        const handleMouseUp = () => setIsClicked(false);
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

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
    const visibleMetrics = stats
        ? [
            { key: 'learners', label: ['Active', 'Learners'],          color: 'text-[#F97316]',    stat: stats.learners },
            { key: 'missions', label: ['Missions', 'Finished'],        color: 'text-white',        stat: stats.missions },
            { key: 'xp',       label: ['Knowledge', 'XP Distributed'], color: 'text-white',        stat: stats.xp },
            { key: 'visits',   label: ['Global', 'Interactions'],      color: 'text-white',        stat: stats.visits },
        ].filter(m => m.stat?.show && m.stat?.value > 0)
        : [];

    const openApp = () => {
        setMobileMenuOpen(false);
        navigate('/dashboard');
    };

    const openAuth = () => {
        setMobileMenuOpen(false);
        navigate(isAuthenticated ? '/dashboard' : '/login');
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white relative overflow-hidden flex flex-col font-['Inter',_sans-serif]">
            <Helmet>
                <title>QuestXP — Gamified Learning from YouTube Playlists | AI Quizzes, XP, Streaks</title>
                <meta name="description" content="QuestXP turns any YouTube playlist into a structured course with AI-generated quizzes, notes, and study roadmaps. Earn XP, level up, build streaks, and learn with friends in private squads." />
                <meta name="keywords" content="QuestXP, gamified learning, YouTube to course, AI study assistant, study roadmap, XP, study streak, learning platform India, AI quiz generator, coding roadmap" />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
                <meta name="author" content="Parth Patidar" />
                <link rel="canonical" href="https://questxp.in/" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Helmet>

            {/* Interactive Spotlight (Orange Glow) */}
            <motion.div 
                className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
                animate={{ 
                    background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(249, 115, 22, ${isClicked ? 0.22 : 0.1}), transparent 80%)` 
                }}
                transition={{ type: "tween", ease: "backOut", duration: 0.5 }}
            />

            {/* Vertical Guide Lines */}
            <div className="absolute inset-0 pointer-events-none flex justify-between px-4 max-w-screen-xl mx-auto z-0 opacity-[0.07] h-full">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-[1px] h-full bg-[#27272A]" />
                ))}
            </div>

            {/* Ambient Top Glow */}
            <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-gradient-to-b from-[#F97316]/20 to-[#EA580C]/0 blur-[130px] pointer-events-none z-0" />
            <div className="absolute top-[40%] right-[10%] w-[350px] h-[350px] rounded-full bg-[#EA580C]/4 blur-[100px] pointer-events-none z-0" />
            <div className="absolute bottom-[20%] left-[5%] w-[450px] h-[450px] rounded-full bg-[#F97316]/4 blur-[120px] pointer-events-none z-0" />

            {/* HEADER */}
            <header className="relative z-20 border-b border-[#27272A] bg-[#000000]/80 backdrop-blur-md">
                <div className="max-w-screen-xl mx-auto px-6 h-20 flex items-center justify-between gap-3">
                    <Link to="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
                        <img src="/favicon.png" alt="QuestXP" className="w-9 h-9 object-contain rounded-lg shadow-sm border border-[#27272A]" />
                        <span className="text-xl font-bold tracking-tight text-white">QuestXP</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-2 text-xs font-['JetBrains_Mono',_monospace] tracking-widest text-[#A1A1AA]">
                        <a href="#how-it-works" className="px-4 py-2 hover:text-white transition-colors">CAPABILITIES</a>
                        <a href="#plans" className="px-4 py-2 hover:text-white transition-colors">PLANS</a>
                        <a href="#features" className="px-4 py-2 hover:text-white transition-colors">FEATURES</a>
                        <button 
                            onClick={() => setFeedbackOpen(true)}
                            className="px-4 py-2 hover:text-white transition-colors text-left"
                        >
                            FEEDBACK
                        </button>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard?demo=true')} 
                            className="flex flex-col items-center px-4 py-1.5 rounded-lg border border-[#27272A] bg-[#191C21] hover:border-[#F97316]/50 hover:bg-[#191C21]/80 transition-all group"
                        >
                            <span className="text-xs font-bold font-['JetBrains_Mono',_monospace] text-[#A1A1AA] group-hover:text-white leading-none">TRY DEMO</span>
                            <span className="text-[7px] font-['JetBrains_Mono',_monospace] text-[#F97316] uppercase tracking-wider mt-1 font-semibold opacity-80">No Sign-in</span>
                        </button>
                        <button 
                            onClick={openAuth} 
                            className="text-xs font-['JetBrains_Mono',_monospace] tracking-wider text-[#A1A1AA] hover:text-white transition-colors px-4"
                        >
                            {isAuthenticated && !isLoading ? 'DASHBOARD' : 'SIGN IN'}
                        </button>
                        <button 
                            onClick={openApp} 
                            className="bg-[#F97316] hover:bg-[#EA580C] text-xs font-['JetBrains_Mono',_monospace] tracking-widest text-white px-5 py-2.5 rounded-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            GET STARTED
                        </button>
                    </div>

                    <div className="md:hidden flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            className="p-2 rounded-lg border border-[#27272A] bg-[#191C21] text-[#A1A1AA]"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-[#27272A] bg-[#000000] px-6 py-6 font-['JetBrains_Mono',_monospace] tracking-widest text-xs space-y-4">
                        <div className="flex flex-col gap-3">
                            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#A1A1AA] hover:text-white">CAPABILITIES</a>
                            <a href="#plans" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#A1A1AA] hover:text-white">PLANS</a>
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#A1A1AA] hover:text-white">FEATURES</a>
                            <button 
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    setFeedbackOpen(true);
                                }} 
                                className="py-2 text-left text-[#A1A1AA] hover:text-white"
                            >
                                FEEDBACK
                            </button>
                            <button 
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    navigate('/dashboard?demo=true');
                                }} 
                                className="py-2 text-left text-[#A1A1AA] hover:text-white flex justify-between"
                            >
                                <span>TRY DEMO</span>
                                <span className="text-[#F97316] font-bold">NO SIGN-IN</span>
                            </button>
                            <button onClick={openAuth} className="w-full py-3 rounded-lg border border-[#27272A] bg-[#191C21] text-white text-center font-bold">
                                {isAuthenticated && !isLoading ? 'DASHBOARD' : 'SIGN IN'}
                            </button>
                            <button onClick={openApp} className="w-full py-3 rounded-lg bg-[#F97316] text-white text-center font-bold">
                                GET STARTED
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main className="relative z-10 flex-1">
                {/* HERO SECTION */}
                <section id="how-it-works" className="max-w-screen-xl mx-auto px-6 pt-20 pb-20 relative">
                    <div className="flex flex-col items-center text-center">
                        {/* Free to start badge */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#27272A] bg-[#191C21] mb-8"
                        >
                            <span className="text-[10px] font-['JetBrains_Mono',_monospace] font-bold text-[#F97316] tracking-[0.2em] uppercase">
                                ✦ FREE TO START
                            </span>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="relative max-w-4xl"
                        >
                            <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight text-white mb-6 select-none font-['Inter',_sans-serif]">
                                <span className="relative inline-block font-['Playfair_Display',_serif] font-normal italic pr-2">
                                    QuestXP
                                    <svg className="absolute left-0 bottom-[-8px] w-full h-[6px] opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                                        <path d="M0,5 C25,10 25,0 50,5 C75,10 75,0 100,5" fill="none" stroke="#F97316" strokeWidth="2.5" />
                                    </svg>
                                </span>
                                <span className="block mt-4 sm:inline sm:mt-0 font-['JetBrains_Mono',_monospace] tracking-tight font-extrabold text-[#FFFFFF] text-4xl sm:text-6xl lg:text-[4.5rem]">
                                    for{' '}
                                    <span className="inline-block border-2 border-white bg-white text-black px-4 py-0.5 rounded-[4px] font-black uppercase tracking-normal">
                                        LEARNERS
                                    </span>
                                </span>
                            </h1>
                        </motion.div>

                        {/* Subheading */}
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-base sm:text-xl text-[#A1A1AA] max-w-2xl leading-relaxed mt-6 font-['Playfair_Display',_serif] italic font-light"
                        >
                            Transform chaotic YouTube playlists and massive one-shots into structured, modular courses. Learn efficiently with adaptive roadmaps, AI quizzes, and zero-distraction focus.
                        </motion.p>

                        {/* Action buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto"
                        >
                            <button 
                                onClick={openApp} 
                                className="group w-full sm:w-auto bg-[#F97316] hover:bg-[#EA580C] text-white font-['JetBrains_Mono',_monospace] font-bold text-sm tracking-widest px-8 py-4 rounded-[8px] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:scale-[1.02]"
                            >
                                START LEARNING
                                <ChevronRight className="w-4 h-4 transform rotate-[-45deg] transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]" />
                            </button>
                            <button 
                                onClick={() => setVideoOpen(true)}
                                className="w-full sm:w-auto bg-[#191C21] hover:bg-[#191C21]/80 text-[#A1A1AA] hover:text-white border border-[#27272A] font-['JetBrains_Mono',_monospace] font-bold text-sm tracking-widest px-8 py-4 rounded-[8px] transition-all flex items-center justify-center gap-2"
                            >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                WATCH PREVIEW
                            </button>
                        </motion.div>

                        {/* Large Image container with premium shadows */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
                            className="mt-20 w-full max-w-5xl rounded-xl border border-[#27272A] bg-[#191C21] p-2 shadow-2xl relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#F97316]/5 to-transparent pointer-events-none" />
                            <img 
                                src="/Images/dashboard_landing_page.png" 
                                alt="QuestXP Dashboard" 
                                className="w-full h-auto rounded-lg block object-cover"
                            />
                            
                            {/* Glass overlay on bottom */}
                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent backdrop-blur-[2px] flex items-center justify-between px-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
                                    <span className="text-[9px] font-['JetBrains_Mono',_monospace] font-bold text-white uppercase tracking-widest">ACTIVE STUDY WORKSPACE</span>
                                </div>
                                <Sparkles className="w-4 h-4 text-[#F97316]" />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* METRICS SECTION */}
                {visibleMetrics.length > 0 && (
                    <section className="py-10 relative">
                        <div className="max-w-5xl mx-auto px-6">
                            <div className="bg-[#191C21]/80 backdrop-blur-md border border-[#27272A] rounded-2xl p-8 shadow-xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[#F97316]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-y-0 relative z-10">
                                    {visibleMetrics.map((m) => (
                                        <div
                                            key={m.key}
                                            className="flex flex-col items-center justify-center text-center p-4 md:border-r border-[#27272A]/40 md:last:border-r-0"
                                        >
                                            <p className={`text-4xl sm:text-5xl font-extrabold ${m.color} font-['JetBrains_Mono',_monospace] tracking-tight mb-2`}>
                                                {formatMetric(m.stat.value)}
                                            </p>
                                            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-[0.2em] leading-tight font-['JetBrains_Mono',_monospace]">
                                                {m.label[0]} <br/> {m.label[1]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* PLANS & PRICING COMPARISON SECTION */}
                <section id="plans" className="max-w-screen-xl mx-auto px-6 py-24 relative">
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-['JetBrains_Mono',_monospace] font-bold text-[#F97316] tracking-[0.35em] uppercase block mb-4">COMPARE TIERS</span>
                        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight font-['Playfair_Display',_serif] mb-4">
                            Choose Your Learning Pace
                        </h2>
                        <p className="text-[#A1A1AA] max-w-2xl mx-auto text-base sm:text-lg">
                            QuestXP is free to start. Lock in advanced AI chapterization and unlimited doubts with Pro.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                        {/* Novice Plan */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-[#191C21] border border-[#27272A] rounded-xl p-8 flex flex-col justify-between hover:border-[#27272A]/80 transition-all shadow-lg relative overflow-hidden group"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[11px] font-['JetBrains_Mono',_monospace] tracking-widest text-[#A1A1AA] uppercase font-bold">NOVICE LEARNER</p>
                                        <h3 className="text-2xl font-bold text-white mt-1">Free Tier</h3>
                                    </div>
                                    <span className="text-xs font-['JetBrains_Mono',_monospace] border border-[#27272A] px-2.5 py-1 rounded bg-[#000000] text-[#A1A1AA] font-bold">BASIC</span>
                                </div>
                                <div className="flex items-baseline gap-1 font-['JetBrains_Mono',_monospace]">
                                    <span className="text-4xl font-extrabold text-white">₹0</span>
                                    <span className="text-xs text-[#A1A1AA] tracking-wider uppercase">/ FOREVER</span>
                                </div>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed font-['Playfair_Display',_serif] italic">
                                    Perfect for self-paced students organizing single playlists and building local study streaks.
                                </p>
                                <hr className="border-[#27272A]/60" />
                                <ul className="space-y-3.5 text-xs text-[#A1A1AA]">
                                    {[
                                        "Up to 10 active roadmaps concurrently",
                                        "Standard playlist import & chapter sync",
                                        "Standard RAG chatbot (5 doubts per hour)",
                                        "Daily study streaks & progress tracking",
                                        "Global XP Leaderboard access"
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button
                                onClick={openApp}
                                className="w-full py-3.5 rounded-lg border border-[#27272A] hover:border-[#A1A1AA] bg-[#000000] text-white hover:bg-[#000000]/80 font-['JetBrains_Mono',_monospace] font-bold text-xs tracking-widest transition-all mt-8"
                            >
                                START FREE
                            </button>
                        </motion.div>

                        {/* Pro Plan */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.15 }}
                            className="bg-[#191C21] border-2 border-[#F97316] rounded-xl p-8 flex flex-col justify-between hover:scale-[1.01] transition-all shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 bg-[#F97316] text-white text-[9px] font-['JetBrains_Mono',_monospace] tracking-wider font-extrabold px-4 py-1.5 rounded-bl-lg uppercase">
                                RECOMMENDED
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[11px] font-['JetBrains_Mono',_monospace] tracking-widest text-[#F97316] uppercase font-bold">ACADEMIC PRO</p>
                                        <h3 className="text-2xl font-bold text-white mt-1">Pro Quest</h3>
                                    </div>
                                    <span className="text-xs font-['JetBrains_Mono',_monospace] border border-[#F97316]/50 bg-[#F97316]/10 px-2.5 py-1 rounded text-[#F97316] font-bold">POWER</span>
                                </div>
                                <div className="flex items-baseline gap-1 font-['JetBrains_Mono',_monospace]">
                                    <span className="text-4xl font-extrabold text-white">₹499</span>
                                    <span className="text-xs text-[#A1A1AA] tracking-wider uppercase">/ MONTH</span>
                                </div>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed font-['Playfair_Display',_serif] italic">
                                    For dedicated builders and engineers who want maximum speed and unlimited AI query capabilities.
                                </p>
                                <hr className="border-[#27272A]" />
                                <ul className="space-y-3.5 text-xs text-[#A1A1AA]">
                                    {[
                                        "Unlimited active roadmaps & AI generation",
                                        "Priority AI chapterization for 10+ hr one-shots",
                                        "Unlimited RAG doubt chatbot queries",
                                        "PDF, markdown, & document upload processing",
                                        "Private FriendZones with detailed squad analytics",
                                        "Exclusive streak share overlays & custom badges"
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <Zap className="w-4 h-4 text-[#F97316] shrink-0 fill-[#F97316]/20" />
                                            <span className="text-white">{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button
                                onClick={openApp}
                                className="w-full py-3.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-['JetBrains_Mono',_monospace] font-bold text-xs tracking-widest transition-all mt-8 shadow-[0_4px_20px_rgba(249,115,22,0.25)]"
                            >
                                UPGRADE TO PRO
                            </button>
                        </motion.div>
                    </div>
                </section>

                {/* DYNAMIC ROADMAPS FEATURE */}
                <section className="max-w-screen-xl mx-auto px-6 py-20 border-t border-[#27272A]/40 relative">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 text-xs font-bold text-[#F97316] font-['JetBrains_Mono',_monospace] uppercase tracking-widest">
                                <Map className="w-3.5 h-3.5" />
                                ADAPTIVE SYSTEM
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] font-['Playfair_Display',_serif]">
                                Build Interactive <br/><span className="text-[#F97316] italic font-normal">Learning Paths</span>
                            </h2>
                            <p className="text-[#A1A1AA] text-base sm:text-lg leading-relaxed font-light">
                                Visual learning paths that automatically stretch and recalculate. Transform complex video concepts into structured milestone modules and track completion status automatically.
                            </p>
                            
                            <ul className="space-y-4 font-['JetBrains_Mono',_monospace] text-xs text-[#A1A1AA]">
                                {[
                                    "Visual progress tracking for every milestone",
                                    "Surgical curriculum filtering based on your selection",
                                    "Sequential locks ensuring fundamentals are mastered first"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative rounded-2xl border border-[#27272A] bg-[#191C21] p-2 shadow-2xl group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[#F97316]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <img 
                                src="/Images/Roadmap_landingpage.png" 
                                alt="Dynamic Roadmap Feature" 
                                className="w-full h-auto rounded-xl block object-cover"
                            />
                            {/* Floating Badge */}
                            <div className="absolute -bottom-4 -left-4 z-20 bg-[#191C21] border border-[#27272A] p-4 rounded-xl shadow-lg hidden sm:block">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-['JetBrains_Mono',_monospace] font-bold text-[#A1A1AA] uppercase tracking-wider">LEVEL PROGRESS</p>
                                        <p className="text-xs font-bold text-white">85% Completed</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* FOCUS GUARDIAN FEATURE */}
                <section className="max-w-screen-xl mx-auto px-6 py-20 border-t border-[#27272A]/40 relative">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="order-2 md:order-1 relative rounded-2xl border border-[#27272A] bg-[#191C21] p-2 shadow-2xl group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[#F97316]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <img 
                                src="/Images/notificatiions questXP.jpeg" 
                                alt="QuestXP Focus Notification" 
                                className="w-full h-auto rounded-xl block object-cover"
                            />
                            {/* Floating Badge */}
                            <div className="absolute -bottom-4 -right-4 bg-[#191C21] border border-[#27272A] p-4 rounded-xl shadow-lg flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#58CC02]/10 flex items-center justify-center text-[#58CC02]">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-['JetBrains_Mono',_monospace] font-bold text-white uppercase tracking-wider">GUARD ACTIVE</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 md:order-2 space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-500 font-['JetBrains_Mono',_monospace] uppercase tracking-widest">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                DISTRACTION LOCK
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] font-['Playfair_Display',_serif]">
                                Active Anti-Distraction <br/><span className="text-[#F97316] italic font-normal">Focus Guardian</span>
                            </h2>
                            <p className="text-[#A1A1AA] text-base sm:text-lg leading-relaxed font-light">
                                Avoid recommendation traps. Our Focus Guardian ensures you stay in deep learning mode by automatically detecting external drifting and prompting subtle educational nudges.
                            </p>
                            
                            <div className="relative p-6 rounded-xl bg-[#191C21] border border-[#27272A] overflow-hidden">
                                <div className="absolute top-0 left-0 w-[3px] h-full bg-[#F97316]" />
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#F97316]/10 flex items-center justify-center shrink-0">
                                        <Bell className="w-5 h-5 text-[#F97316]" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white mb-1 font-['JetBrains_Mono',_monospace]">PROACTIVE NUDGE SYSTEM</p>
                                        <p className="text-sm text-[#A1A1AA] italic font-['Playfair_Display',_serif]">
                                            "You've wandered away from your algorithms class. Time to resume? 🎯"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* MULTIPLE PLAYLISTS BANNER */}
                <section className="max-w-screen-xl mx-auto px-6 py-12">
                    <div className="relative overflow-hidden bg-[#191C21] rounded-2xl border border-[#27272A] py-16 px-8 flex flex-col items-center justify-center shadow-2xl">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_70%)] pointer-events-none" />
                        
                        <motion.div
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center relative z-10 space-y-4"
                        >
                            <span className="text-[9px] font-['JetBrains_Mono',_monospace] font-bold uppercase tracking-[0.4em] text-[#F97316] block mb-4">SYNERGIZED WORKSPACE</span>
                            
                            <div className="flex flex-col items-center">
                                <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[0.95] font-['Inter',_sans-serif]">
                                    MULTIPLE <span className="font-['Playfair_Display',_serif] italic font-normal text-[#F97316]">PLAYLISTS</span>
                                </h2>
                                <div className="flex items-center gap-3 my-4">
                                    <div className="h-[1px] w-12 sm:w-20 bg-[#27272A]" />
                                    <span className="text-lg font-bold text-[#F97316] font-['JetBrains_Mono',_monospace] tracking-widest">•</span>
                                    <div className="h-[1px] w-12 sm:w-20 bg-[#27272A]" />
                                </div>
                                <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[0.95] font-['Inter',_sans-serif]">
                                    SINGLE COURSE
                                </h2>
                            </div>

                            <p className="text-[9px] font-['JetBrains_Mono',_monospace] font-bold text-[#A1A1AA] tracking-[0.2em] uppercase mt-8">
                                THE DEFINITIVE LMS FOR INDEPENDENT ENGINEERS.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* FEATURES GRID SECTION */}
                <section id="features" className="max-w-screen-xl mx-auto px-6 py-24 border-t border-[#27272A]/40 relative">
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-['JetBrains_Mono',_monospace] font-bold text-[#F97316] tracking-[0.3em] uppercase block mb-4">PLATFORM HIGHLIGHTS</span>
                        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight font-['Playfair_Display',_serif] mb-4">
                            Deep Learning Tools
                        </h2>
                        <p className="text-[#A1A1AA] max-w-2xl mx-auto text-base sm:text-lg">
                            We combine traditional course structures with powerful AI features to keep you learning.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: BookOpen, title: "AI Course Builder", desc: "Instantly transform playlist links and long lectures into clean, modular study schedules." },
                            { icon: Sparkles, title: "RAG Doubt Chatbot", desc: "Ask questions grounded directly in lecture transcripts and skip directly to answers." },
                            { icon: Map, title: "Curated Roadmaps", desc: "Generate schedules for only the specific videos and topics you actually want to learn." },
                            { icon: Trophy, title: "Gamified Engine", desc: "Earn experience points (XP), level up, and unlock achievements for daily study milestones." },
                            { icon: Users, title: "Friend Squads", desc: "Form private zones with friends, share active study plans, and compete on joint leaderboards." },
                            { icon: Activity, title: "Focus Tracker", desc: "Stay accountable with automated nudges that detect when you drift away during study." }
                        ].map((feat, idx) => (
                            <div key={idx} className="bg-[#191C21] border border-[#27272A] rounded-xl p-8 hover:border-[#F97316]/40 transition-all flex flex-col items-start gap-5">
                                <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                                    <feat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white font-['Playfair_Display',_serif]">{feat.title}</h3>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed font-light">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* LEADERBOARD SECTION */}
                <section className="max-w-screen-xl mx-auto px-6 py-20 border-t border-[#27272A]/40 relative">
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-['JetBrains_Mono',_monospace] font-bold text-[#F97316] tracking-[0.3em] uppercase block mb-4">HALL OF FAME</span>
                        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight font-['Playfair_Display',_serif] mb-4">
                            Global Leaderboards
                        </h2>
                        <p className="text-[#A1A1AA] max-w-2xl mx-auto text-base sm:text-lg">
                            Earn XP for daily study, maintain your streak, and climb the ranks alongside other self-taught developers.
                        </p>
                    </div>

                    <div className="relative bg-[#191C21]/60 border border-[#27272A] p-8 rounded-2xl shadow-xl">
                        <div className="absolute inset-0 bg-[#F97316]/3 blur-3xl pointer-events-none rounded-full" />
                        <LeaderboardPodium 
                            players={[
                                { name: 'Alex_Mastery', totalXP: 12450, level: 12 },
                                { name: 'Quantum_Learner', totalXP: 10200, level: 10 },
                                { name: 'Deep_Focus', totalXP: 9850, level: 9 },
                            ]} 
                        />
                        
                        <div className="mt-12 text-center">
                            <button 
                                onClick={openApp} 
                                className="bg-[#191C21] hover:bg-[#191C21]/80 text-[#A1A1AA] hover:text-white border border-[#27272A] font-['JetBrains_Mono',_monospace] font-bold text-xs tracking-widest px-8 py-4 rounded-[8px] transition-all inline-flex items-center gap-2"
                            >
                                VIEW GLOBAL RANKINGS
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* TESTIMONIALS SECTION */}
                <section className="py-24 bg-[#191C21]/40 border-t border-b border-[#27272A]/40 overflow-hidden relative">
                    <div className="max-w-screen-xl mx-auto px-6 mb-16">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <span className="text-[#F97316] font-['JetBrains_Mono',_monospace] font-bold text-[10px] tracking-[0.3em] uppercase">WALL OF LOVE</span>
                            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight font-['Playfair_Display',_serif]">What Learners Say</h2>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex overflow-hidden relative">
                            <motion.div 
                                className="flex gap-6 py-4 px-3"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ 
                                    duration: 35, 
                                    repeat: Infinity, 
                                    ease: "linear" 
                                }}
                                whileHover={{ animationPlayState: "paused" }}
                            >
                                {[...Array(2)].map((_, i) => (
                                    <React.Fragment key={i}>
                                        {[
                                            { name: 'sarah01', text: 'QuestXP stops me from doom-scrolling. I open the app, watch my playlist, and actually learn.' },
                                            { name: 'jamesdev', text: 'The notes feature linked to timestamps is a game changer. I can jump back to exactly where I got confused.' },
                                            { name: 'ruchii', text: 'I use this for my anatomy lecture playlists. Turning them into a course makes studying so much less overwhelming.' },
                                            { name: 'mk_codes', text: 'Cleanest learning experience I\'ve found. No distractions, just the content I need.' },
                                            { name: 'aditya.s', text: 'Being able to see my progress visually is surprisingly motivating. Love the minimal design.' },
                                            { name: 'alok7', text: 'Finally finished a 12-hour React course. The progress tracking is the only reason I didn\'t quit halfway.' },
                                        ].map((t, idx) => (
                                            <div 
                                                key={idx} 
                                                className="w-[350px] shrink-0 p-8 rounded-xl bg-[#191C21] border border-[#27272A] hover:border-[#F97316]/50 transition-all duration-300 relative overflow-hidden group"
                                            >
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Sparkles className="w-8 h-8 text-[#F97316]" />
                                                </div>
                                                <p className="text-[#A1A1AA] text-sm font-light leading-relaxed mb-8 relative z-10 font-['Playfair_Display',_serif] italic">
                                                    "{t.text}"
                                                </p>
                                                <div className="flex items-center gap-4 relative z-10 font-['JetBrains_Mono',_monospace]">
                                                    <div className="w-10 h-10 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316] font-bold text-lg">
                                                        {t.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white">@{t.name}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </motion.div>
                        </div>
                        {/* Fades */}
                        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#000000] to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#000000] to-transparent z-10 pointer-events-none" />
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
