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
import FeedbackModal from '../components/FeedbackModal';
import VideoModal from '../components/VideoModal';
import { Play } from 'lucide-react';
import Footer from '../components/ui/Footer';


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

                <section id="why" className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-10 text-center max-w-4xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-4">Why we built QuestXP</h2>
                        <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
                            No single YouTube channel is perfect. You might love <span className="text-text-primary font-medium">React</span> from one creator, and <span className="text-text-primary font-medium">Node.js</span> from another. But jumping between channels means scattered playlists, lost progress, and endless YouTube distractions.
                        </p>
                        <p className="text-sm sm:text-base text-text-primary font-medium leading-relaxed">
                            QuestXP brings all your favorite playlists from different creators into <span className="text-primary">one unified workspace</span>. Build your custom learning path, track everything in one place, and focus without the noise.
                        </p>
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
                                { step: '1', text: 'Paste a YouTube playlist', sub: 'Open playlist in new tab & copy URL (not the video link)' },
                                { step: '2', text: 'QuestXP builds your course structure', sub: 'AI parses lectures and sections' },
                                { step: '3', text: 'Study daily and track progress', sub: 'Earn XP and level up as you learn' },
                            ].map((item) => (
                                <div key={item.step} className="rounded-lg border border-border bg-surface-2 px-4 py-4">
                                    <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold mb-2">
                                        {item.step}
                                    </div>
                                    <p className="text-sm font-semibold text-text-primary mb-1">{item.text}</p>
                                    <p className="text-[10px] text-text-muted leading-tight">{item.sub}</p>
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
