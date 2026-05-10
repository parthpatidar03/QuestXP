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

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary leading-[1.05] tracking-[-0.04em] max-w-[14ch] font-display">
                                Turn playlists into courses you can actually finish.
                            </h1>

                            <div className="mt-8 space-y-3">
                                {keyPoints.map((point, i) => (
                                    <div key={i} className="flex items-center gap-3 text-text-secondary">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-sm sm:text-base font-medium">{point}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-8 text-base sm:text-lg text-text-secondary leading-relaxed max-w-[52ch]">
                                <strong>Life happens. Missed a day?</strong> Shift your plan with one click. 
                                QuestXP's surgical engine instantly recalculates your entire study roadmap 
                                in real-time, keeping your goals within reach without the guilt.
                            </p>

                            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
                                <button onClick={openApp} className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base">
                                    Start Learning
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setVideoOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-surface text-sm sm:text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
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
                                    <h3 className="text-sm font-bold text-text-primary mb-1 -mt-1">1. Add Playlists</h3>
                                    <p className="text-xs text-text-secondary leading-relaxed mb-3">Paste any YouTube playlist link into your dashboard.</p>
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
                                    <h3 className="text-sm font-bold text-text-primary mb-1 -mt-1">2. AI Course Roadmap</h3>
                                    <p className="text-xs text-text-secondary leading-relaxed mb-3">QuestXP generates a structured roadmap with sections.</p>
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

                <section className="py-12 flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <span className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.02em] text-transparent bg-clip-text bg-gradient-to-r from-primary via-gold to-primary pr-4 font-display">
                            # Multiple Playlists • Single Course
                        </span>
                    </motion.div>
                </section>

                <section id="why" className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="rounded-2xl border border-border bg-surface-2 dark:bg-primary/5 dark:border-primary/20 p-6 sm:p-10 text-center max-w-4xl mx-auto shadow-sm">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-4">Why we built QuestXP</h2>
                        <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
                            No single YouTube channel is perfect. You might love <span className="text-text-primary font-medium">Photography tips</span> from one creator, and <span className="text-text-primary font-medium">Personal Finance</span> from another. But jumping between channels means scattered playlists, lost progress, and endless YouTube distractions.
                        </p>
                        <p className="text-sm sm:text-base text-text-primary font-medium leading-relaxed">
                            QuestXP brings all your favorite playlists from different creators into <span className="text-primary">one unified workspace</span>. Build your custom learning path, track everything in one place, and focus without the noise.
                        </p>
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
                                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-success" />
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

                    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <article className="glass-card p-6 sm:p-8 group hover:border-primary/50 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">AI Course Roadmaps</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Transform multiple YouTube playlists from different creators into a single, cohesive learning platform.
                            </p>
                        </article>

                        <article className="glass-card p-6 sm:p-8 group hover:border-primary/50 transition-all border-primary/20 bg-primary/5">
                            <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Surgical Adaptive Planning</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Life happens. Missed a day? Hit <span className="text-primary font-bold">+</span>. 
                                Finished early? Hit <span className="text-primary font-bold">-</span>. 
                                QuestXP instantly recalculates your entire roadmap in real-time to keep you on track.
                            </p>
                        </article>

                        <article className="glass-card p-6 sm:p-8 group hover:border-primary/50 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Contextual AI Chatbot</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Chat with an AI that knows your course inside out. Get precise answers based specifically on the lecture content.
                            </p>
                        </article>

                        <article className="glass-card p-6 sm:p-8 group hover:border-primary/50 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Automated Assets</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Generate lecture summaries, key takeaways, and practice quizzes instantly. Focus on learning while we handle the notes.
                            </p>
                        </article>

                        <article className="glass-card p-6 sm:p-8 group hover:border-primary/50 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Flame className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Productivity Analytics</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Track your rank, learning time, and streaks. Compete on the leaderboard and maintain consistency with deep analytics.
                            </p>
                        </article>

                        <article className="glass-card p-6 sm:p-8 group hover:border-primary/50 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Distraction-Free Player</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                A specialized player designed for focus. No ads, no recommendations—just your course content and learning tools.
                            </p>
                        </article>
                    </div>
                </section>

            </main>

            <Footer onOpenFeedback={() => setFeedbackOpen(true)} />
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} contextPage="Landing Page" />
            <VideoModal 
                isOpen={videoOpen} 
                onClose={() => setVideoOpen(false)} 
                videoUrl="https://res.cloudinary.com/dx7uo17cy/video/upload/q_auto/f_auto/v1777964684/Video_Project_zfs9vm.mp4" 
            />
        </div>
    );
};


export default LandingPage;
