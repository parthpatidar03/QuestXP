import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Flame, Code, BookOpen, ChevronRight } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    // 3D Mouse tracking state for the hero graphic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useTransform(x, [-0.5, 0.5], [-20, 20]);
    const mouseYSpring = useTransform(y, [-0.5, 0.5], [20, -20]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        animate(x, 0, { duration: 0.5, ease: "easeOut" });
        animate(y, 0, { duration: 0.5, ease: "easeOut" });
    };

    return (
        <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col font-body">
            {/* Background Grid & Glows */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Navbar */}
            <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-8 h-8 text-primary" />
                    <span className="text-xl font-display font-bold text-text-primary tracking-tight">QuestXP</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-text-secondary hover:text-text-primary font-medium transition-colors">
                        Enter App
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Main Hero */}
            <main className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-center max-w-7xl mx-auto px-6 gap-12 lg:gap-24 w-full pt-12 md:pt-0">
                
                {/* Text Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex-1 max-w-xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-2 mb-6 text-sm text-text-secondary">
                        <Flame className="w-4 h-4 text-warning" />
                        <span>Focus deeply. Level up constantly.</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-display font-bold text-text-primary leading-[1.1] mb-6 tracking-tight">
                        Power up <br/>
                        your <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#818CF8]">study sessions.</span>
                    </h1>
                    
                    <p className="text-lg text-text-secondary mb-8 leading-relaxed max-w-lg">
                        Turn your YouTube playlists into structured, gamified courses. Earn XP, maintain streaks, and dominate your learning goals without distractions.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center justify-center gap-2 group text-base py-3 px-8">
                            Start Learning Now
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>

                {/* 3D Interactive Framer Motion Element */}
                <div 
                    className="flex-1 w-full max-w-[500px] aspect-square relative perspective-[1200px]"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <motion.div
                        style={{
                            rotateX: mouseYSpring,
                            rotateY: mouseXSpring,
                            transformStyle: "preserve-3d"
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="w-full h-full absolute inset-0 flex items-center justify-center"
                    >
                        {/* 3D Floating Layers */}
                        
                        {/* Background Base Card */}
                        <div 
                            className="absolute w-3/4 h-3/4 rounded-2xl bg-surface border border-border shadow-[0_25px_50px_rgba(0,0,0,0.6)] flex items-center justify-center"
                            style={{ transform: "translateZ(0px)" }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl"></div>
                        </div>

                        {/* Mid Layer: Code / Study Block */}
                        <div 
                            className="absolute w-2/3 h-[120px] bg-surface-2 border border-border rounded-xl top-1/4 shadow-xl p-4 flex flex-col gap-3"
                            style={{ transform: "translateZ(60px)" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg"><Code className="w-5 h-5 text-primary" /></div>
                                <div className="h-4 w-32 bg-border rounded animate-pulse"></div>
                            </div>
                            <div className="space-y-2 pl-11">
                                <div className="h-2 w-full bg-border rounded"></div>
                                <div className="h-2 w-4/5 bg-border rounded"></div>
                            </div>
                        </div>

                        {/* Top Layer: Floating Gamification Elements */}
                        <motion.div 
                            animate={{ y: [-5, 5, -5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute right-4 bottom-1/4 px-4 py-3 bg-surface border border-primary/30 rounded-[10px] shadow-[0_0_20px_rgba(56,189,248,0.2)] flex items-center gap-3"
                            style={{ transform: "translateZ(120px)" }}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-warning to-yellow-600 flex items-center justify-center border-2 border-surface">
                                <Flame className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Streak</div>
                                <div className="text-lg font-display font-bold text-warning">14 Days</div>
                            </div>
                        </motion.div>

                        <motion.div 
                            animate={{ y: [5, -5, 5] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute left-8 bottom-1/3 px-4 py-3 bg-surface border border-success/30 rounded-[10px] shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-3"
                            style={{ transform: "translateZ(90px)" }}
                        >
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-success" />
                            </div>
                            <div>
                                <div className="text-sm font-display font-bold text-success">+50 XP</div>
                            </div>
                        </motion.div>

                    </motion.div>
                </div>

            </main>
        </div>
    );
};

export default LandingPage;
