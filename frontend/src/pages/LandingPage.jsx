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
    Trophy,
    Crown,
    Zap,
    ShieldCheck,
    Bell,
    Share2,
} from 'lucide-react';
import { BGPattern } from '../components/ui/bg-pattern';
import FeedbackModal from '../components/FeedbackModal';
import VideoModal from '../components/VideoModal';
import { Play } from 'lucide-react';
import Footer from '../components/ui/Footer';
import LeaderboardPodium from '../components/Dashboard/LeaderboardPodium';


const LandingPage = () => {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);
    const [stats, setStats] = useState({ 
        learners: 0, 
        quizzes: 0, 
        missions: 0, 
        xp: 0 
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/public/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };
        fetchStats();
    }, []);

    const formatMetric = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k+`;
        return `${num}+`;
    };


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
        'Curate your own technical mastery',
        'Built-in focus guardian',
        'Surgical study plan adjustments',
    ];

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [ripples, setRipples] = useState([]);

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e) => {
        const id = Date.now();
        setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 1000);
    };

    return (
        <div 
            className="min-h-screen bg-bg relative overflow-hidden flex flex-col cursor-crosshair"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        >
            {/* Click Ripples */}
            {ripples.map(ripple => (
                <motion.div
                    key={ripple.id}
                    initial={{ opacity: 0.5, scale: 0 }}
                    animate={{ opacity: 0, scale: 4 }}
                    transition={{ duration: 0.8 }}
                    className="pointer-events-none fixed z-50 w-8 h-8 rounded-full border border-primary/40 bg-primary/10"
                    style={{ 
                        left: ripple.x - 16, 
                        top: ripple.y - 16,
                    }}
                />
            ))}
            {/* Mouse Glow Effect */}
            <div 
                className="pointer-events-none fixed inset-0 z-50 opacity-30 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(34, 197, 94, 0.15), transparent 80%)`
                }}
            />

            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-20 z-0" />

            <header className="relative z-20 border-b border-border bg-surface/90 backdrop-blur">
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
                        <button onClick={() => navigate('/login')} className="btn-blink bg-red-600 text-sm px-6 py-2.5 rounded-lg text-white font-bold transition-all hover:bg-red-700">
                            Sign in
                        </button>
                        <button onClick={openApp} className="btn-blink btn-primary text-sm px-6 py-2.5">
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
                            <button onClick={() => navigate('/login')} className="mt-2 w-full py-3 rounded-lg bg-red-600 text-white font-bold text-center hover:bg-red-700 transition-colors">Sign in</button>
                            <button onClick={openApp} className="mt-2 btn-primary w-full">Get Started</button>
                        </div>
                    </div>
                )}
            </header>

            <main className="relative z-10 flex-1">
                <section id="how-it-works" className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10 sm:pb-14">
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

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary leading-[1.05] tracking-[-0.04em] max-w-[14ch] font-display">
                                Turn 
                                <img src="/yt-icon.png" alt="YouTube" className="inline-block w-[1.1em] h-[1.1em] mx-2 -mt-1 vertical-middle align-middle" /> 
                                playlists into courses you can actually finish.
                            </h1>

                            <p className="mt-8 text-lg sm:text-xl text-text-primary font-medium leading-snug max-w-[45ch]">
                                We buy expensive courses but end up on YouTube. It has the content, but lacks the 
                                <span className="text-primary italic"> structure, gamification, and personalization </span> 
                                you need to finish. 
                                <span className="text-primary block mt-2">QuestXP transforms Playlists or single long videos into structured courses.</span>
                            </p>

                            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
                                <button onClick={openApp} className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm sm:text-base">
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
                            className="relative h-[380px] w-full rounded-2xl border border-border bg-surface-2/40 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl shadow-black/20"
                        >
                            <div className="p-4 border-b border-border bg-surface-2/60 flex items-center gap-2 shrink-0">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <h2 className="text-sm font-semibold text-text-primary tracking-wide">The QuestXP Journey</h2>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-4">
                                {/* Step 1 */}
                                <div className="relative pl-6 border-l border-primary/30 pb-2 group">
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-bg group-hover:scale-125 transition-transform" />
                                    <h3 className="text-sm font-bold text-text-primary mb-1 -mt-1">1. Add Playlists or Videos</h3>
                                    <p className="text-xs text-text-secondary leading-relaxed mb-3">Paste any YouTube playlist or long "one-shot" lecture link.</p>
                                    <div className="rounded border border-border bg-surface p-2 shadow-sm">
                                        <div className="flex items-center gap-2 opacity-50">
                                            <div className="w-3 h-3 rounded bg-white/20" />
                                            <div className="h-1.5 w-1/2 bg-white/20 rounded" />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="relative pl-6 border-l border-primary/30 pb-2 group">
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-surface border border-primary ring-4 ring-bg group-hover:bg-primary transition-colors" />
                                    <h3 className="text-sm font-bold text-text-primary mb-1 -mt-1">2. AI Auto-Splitting</h3>
                                    <p className="text-xs text-text-secondary leading-relaxed mb-3">QuestXP splits long lectures into logical, 15-min missions automatically.</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="h-6 rounded border border-border bg-surface shadow-sm" />
                                        <div className="h-6 rounded border border-border bg-surface shadow-sm" />
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="relative pl-6 border-l border-primary/30 pb-2 group">
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-surface border border-primary ring-4 ring-bg group-hover:bg-primary transition-colors" />
                                    <h3 className="text-sm font-bold text-text-primary mb-1 -mt-1">3. Learn & Take Quizzes</h3>
                                    <p className="text-xs text-text-secondary leading-relaxed mb-3">Watch lectures without distractions and complete AI quizzes.</p>
                                    <div className="rounded border border-border bg-surface p-2 flex gap-2 items-center shadow-sm">
                                        <CheckCircle2 className="w-3 h-3 text-success opacity-70" />
                                        <div className="h-1.5 w-full bg-white/10 rounded" />
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="relative pl-6 border-l border-transparent pb-2 group">
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-surface border border-primary ring-4 ring-bg group-hover:bg-primary transition-colors" />
                                    <h3 className="text-sm font-bold text-text-primary mb-1 -mt-1">4. Earn XP & Streaks</h3>
                                    <p className="text-xs text-text-secondary leading-relaxed">Level up your profile as you finish videos and build daily streaks.</p>
                                </div>
                            </div>
                            
                            {/* Scroll fade overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[var(--color-surface-2)] to-transparent pointer-events-none opacity-80" />
                        </motion.div>
                    </div>
                </section>

                <section className="py-12 relative overflow-hidden">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="bg-surface/40 backdrop-blur-md border border-border rounded-[2.5rem] p-12 shadow-2xl relative group overflow-hidden">
                            {/* Inner glow on hover */}
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <p className="text-4xl sm:text-5xl font-black text-primary font-display mb-2">{formatMetric(stats.learners)}</p>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] leading-tight">Active <br/> Learners</p>
                                </div>
                                <div className="flex flex-col items-center justify-center text-center border-l border-border/50">
                                    <p className="text-4xl sm:text-5xl font-black text-text-primary font-display mb-2">{formatMetric(stats.missions)}</p>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] leading-tight">Missions <br/> Finished</p>
                                </div>
                                <div className="flex flex-col items-center justify-center text-center border-l border-border/50">
                                    <p className="text-4xl sm:text-5xl font-black text-text-primary font-display mb-2">{formatMetric(stats.xp)}</p>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] leading-tight">Knowledge <br/> XP Distributed</p>
                                </div>
                                <div className="flex flex-col items-center justify-center text-center border-l border-border/50">
                                    <p className="text-4xl sm:text-5xl font-black text-text-primary font-display mb-2">{formatMetric(stats.visits || 1200)}</p>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] leading-tight">Global <br/> Interactions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
                    <div className="relative overflow-hidden bg-black rounded-[2.5rem] border border-white/10 py-20 px-6 flex flex-col items-center justify-center shadow-2xl">
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



                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-16">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-4">
                            Global Hall of Fame
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto text-base sm:text-lg">
                            Compete with learners worldwide. Earn XP for every lecture, quiz, and milestone you complete.
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


                <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-20">
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
                                Sliding back into the "reels hole"? QuestXP doesn't just track time—it protects it. 
                                Our Guardian detects when you drift into distracting digital loops and sends a sharp, 
                                personalized nudge to snap you back to your learning session.
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
                            <div className="absolute -inset-10 bg-primary/10 blur-[100px] rounded-full opacity-50" />
                            <div className="relative rounded-3xl border border-border p-2 bg-bg shadow-2xl overflow-hidden group">
                                <img 
                                    src="/Images/notificatiions questXP.jpeg" 
                                    alt="QuestXP Focus Notification" 
                                    className="w-full h-auto rounded-2xl group-hover:scale-[1.03] transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                            
                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -right-6 bg-surface-3 border border-border p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
                                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center p-1.5">
                                    <img src="/favicon.png" alt="" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xs font-black text-text-primary uppercase tracking-tighter">Focus Safeguard Active</span>
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

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <article className="glass-card p-6 group border-primary/20 bg-primary/5">
                            <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center mb-4">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">AI Adaptive Roadmaps</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Missed a day? Hit <span className="font-bold text-primary">+</span>. 
                                QuestXP instantly recalculates your entire study path in real-time.
                            </p>
                        </article>

                        <article className="glass-card p-6 group">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Focus Guardian</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Specialized player with zero ads or recommendations. Keeps you in the flow.
                            </p>
                        </article>

                        <article className="glass-card p-6 group">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Gamified Mastery</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Earn XP, maintain streaks, and climb the Global Hall of Fame as you learn.
                            </p>
                        </article>
                    </div>
                </section>

                <section className="py-24 bg-surface/30 overflow-hidden">
                    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 mb-12">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">Wall of Love</span>
                            <h2 className="text-4xl font-black text-text-primary tracking-tight font-display">What learners say</h2>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex animate-scroll hover:[animation-play-state:paused] gap-6 px-4 w-max">
                            {[
                                { name: 'krish_dev', role: 'Full Stack Learner', text: 'QuestXP completely changed how I use YouTube. No more falling into the recommendation trap!' },
                                { name: 'shadow_01', role: 'CS Student', text: 'The AI auto-splitting is magic. Long lectures now feel like achievable missions.' },
                                { name: 'priyanka_tech', role: 'UI Designer', text: 'Finally a platform that gives me structure without charging me hundreds of dollars.' },
                                { name: 'aditya_codes', role: 'Backend Engineer', text: 'XP and streaks keep me coming back every day. It feels like a game but I am actually learning.' },
                                { name: 'sarah_f', role: 'Self Taught', text: 'The focus guardian alert is exactly what I needed. It keeps me honest while studying.' },
                                { name: 'the_viking', role: 'Go Enthusiast', text: 'Turned a 40-hour playlist into a 30-day plan in seconds. Insane productivity tool.' },
                                { name: 'krish_dev', role: 'Full Stack Learner', text: 'QuestXP completely changed how I use YouTube. No more falling into the recommendation trap!' },
                                { name: 'shadow_01', role: 'CS Student', text: 'The AI auto-splitting is magic. Long lectures now feel like achievable missions.' },
                                { name: 'priyanka_tech', role: 'UI Designer', text: 'Finally a platform that gives me structure without charging me hundreds of dollars.' },
                            ].map((t, i) => (
                                <div key={i} className="w-[300px] sm:w-[350px] p-6 rounded-2xl border border-border bg-surface-2 flex flex-col justify-between shadow-lg">
                                    <p className="text-text-secondary text-sm italic leading-relaxed mb-6">"{t.text}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                            {t.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">{t.name}</p>
                                            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
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
