import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Flame } from 'lucide-react';
import { BGPattern } from '../components/ui/bg-pattern';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col font-body">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-30 z-0" />
            
            <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-card group-hover:shadow-lg transition-shadow">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-semibold text-text-primary tracking-tight">QuestXP</span>
                </Link>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-text-secondary hover:text-text-primary font-medium transition-colors">
                        Enter App
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary">
                        Get Started
                    </button>
                </div>
            </nav>

            <main className="flex-1 relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 w-full pt-12 pb-24 md:pt-0">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center text-center w-full"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface/80 backdrop-blur-sm mb-8 text-sm text-text-secondary shadow-sm">
                        <Flame className="w-4 h-4 text-primary" />
                        <span>Study plans, progress, notes, and quizzes in one place.</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-text-primary leading-[1.1] mb-6 tracking-tight max-w-3xl">
                        Turn playlists into courses you can finish.
                    </h1>

                    <p className="text-lg md:text-xl text-text-secondary mb-10 leading-relaxed max-w-2xl">
                        QuestXP converts YouTube playlists into structured learning paths with progress tracking, XP, summaries, quizzes, and a focused study workflow.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center justify-center gap-2 group text-base py-3 px-8 shadow-card hover:shadow-lg transition-all duration-300">
                            Start Learning Now
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default LandingPage;
