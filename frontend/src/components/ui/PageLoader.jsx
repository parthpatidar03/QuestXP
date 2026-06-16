import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, Rocket, Target, BookOpen, Lightbulb } from 'lucide-react';

const LOADING_STATES = [
    { text: "Igniting learning engines...", icon: Rocket },
    { text: "Synthesizing knowledge graph...", icon: BrainCircuit },
    { text: "Connecting scattered nodes...", icon: Target },
    { text: "Compiling syllabus...", icon: BookOpen },
    { text: "Unlocking new insights...", icon: Lightbulb },
    { text: "Preparing your roadmap...", icon: Sparkles },
    { text: "Operating at completion speed...", icon: Rocket },
];

const QUOTES = [
    "Learning is a treasure that will follow its owner everywhere.",
    "The beautiful thing about learning is nobody can take it away from you.",
    "A smooth sea never made a skilled sailor.",
    "Knowledge is power. Knowledge shared is power multiplied.",
    "It does not matter how slowly you go as long as you do not stop."
];

export default function PageLoader() {
    const [currentStateIndex, setCurrentStateIndex] = useState(0);
    const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * QUOTES.length));

    useEffect(() => {
        const stateInterval = setInterval(() => {
            setCurrentStateIndex((prev) => (prev + 1) % LOADING_STATES.length);
        }, 2500);

        const quoteInterval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        }, 6000);

        return () => {
            clearInterval(stateInterval);
            clearInterval(quoteInterval);
        };
    }, []);

    const CurrentIcon = LOADING_STATES[currentStateIndex].icon;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                <div className="w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
            </div>

            <div className="z-10 flex flex-col items-center max-w-md px-6 text-center">
                {/* Main Spinner & Icon Container */}
                <div className="relative w-24 h-24 mb-8">
                    {/* Outer Spinner */}
                    <svg className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-2" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="70 200" strokeLinecap="round" className="text-primary" />
                    </svg>
                    
                    {/* Inner pulse */}
                    <div className="absolute inset-2 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    
                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center text-primary">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStateIndex}
                                initial={{ scale: 0, opacity: 0, rotate: -45 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0, opacity: 0, rotate: 45 }}
                                transition={{ duration: 0.3 }}
                            >
                                <CurrentIcon className="w-8 h-8" />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Loading State Text */}
                <div className="h-8 mb-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStateIndex}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-sm font-bold tracking-widest uppercase text-text-primary/90"
                        >
                            {LOADING_STATES[currentStateIndex].text}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-1.5 mb-12">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                </div>

                {/* Motivational Quote */}
                <div className="h-16 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={quoteIndex}
                            initial={{ opacity: 0, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, filter: 'blur(4px)' }}
                            transition={{ duration: 0.8 }}
                            className="text-sm font-serif italic text-text-muted"
                        >
                            "{QUOTES[quoteIndex]}"
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
