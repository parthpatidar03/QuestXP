import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
    {
        target: '#tour-hero',
        title: 'Continue Study',
        content: 'Your main quest starts here. Click to resume your latest course right where you left off.',
        position: 'bottom'
    },
    {
        target: '#tour-stats',
        title: 'Mastery Metrics',
        content: 'Monitor your rank, total learning time, and productivity in real-time.',
        position: 'bottom'
    },
    {
        target: '#tour-new-course',
        title: 'Expand Knowledge',
        content: 'Paste any YouTube playlist URL here to transform it into a structured course instantly.',
        position: 'bottom'
    },
    {
        target: '#tour-search',
        title: 'Global Search',
        content: 'Quickly find any lesson or topic across all your enrolled courses.',
        position: 'bottom'
    },
    {
        target: '#tour-roadmap',
        title: 'Study Planner',
        content: 'Personalize your learning schedule. Set your daily hours and let AI plan your journey.',
        position: 'bottom'
    },

    {
        target: '#tour-mission',
        title: 'Daily Mission',
        content: 'Complete these targeted videos today to earn massive XP rewards and maintain your streak.',
        position: 'left'
    },
    {
        target: '#tour-leaderboard',
        title: 'Global Rank',
        content: 'Compete with others! Climb the leaderboard by earning XP through daily consistent learning.',
        position: 'left'
    }
];

const UserTour = () => {
    const [currentStep, setCurrentStep] = useState(-1);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState(null);

    const startTour = () => {
        const completed = localStorage.getItem('questxp-tour-completed');
        if (!completed) {
            setCurrentStep(0);
            setIsVisible(true);
        }
    };

    useEffect(() => {
        // Delay slightly to ensure layout is ready
        const timer = setTimeout(startTour, 1500);
        return () => clearTimeout(timer);
    }, []);

    const updateTargetRect = useCallback(() => {
        if (currentStep < 0 || currentStep >= TOUR_STEPS.length) return;
        
        const el = document.querySelector(TOUR_STEPS[currentStep].target);
        if (el) {
            setTargetRect(el.getBoundingClientRect());
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // If target missing (e.g. hero when no course), skip to next
            handleNext();
        }
    }, [currentStep]);

    useEffect(() => {
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        return () => window.removeEventListener('resize', updateTargetRect);
    }, [currentStep, updateTargetRect]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeTour();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const skipTour = () => {
        completeTour();
    };

    const completeTour = () => {
        setIsVisible(false);
        setCurrentStep(-1);
        localStorage.setItem('questxp-tour-completed', 'true');
    };

    if (!isVisible || !targetRect) return null;

    const step = TOUR_STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Spotlight Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                <defs>
                    <mask id="spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left - 8}
                            y={targetRect.top - 8}
                            width={targetRect.width + 16}
                            height={targetRect.height + 16}
                            rx="12"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.7)"
                    mask="url(#spotlight-mask)"
                    className="backdrop-blur-[2px]"
                    onClick={skipTour}
                />
            </svg>

            {/* Tooltip */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        left: step.position === 'left' 
                            ? targetRect.left - 320 
                            : Math.max(20, Math.min(window.innerWidth - 320, targetRect.left + (targetRect.width / 2) - 150)),
                        top: step.position === 'bottom' 
                            ? targetRect.bottom + 20 
                            : targetRect.top + (targetRect.height / 2) - 100
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute w-[300px] bg-surface border border-primary/30 shadow-2xl rounded-2xl p-6 pointer-events-auto"
                    style={{ position: 'fixed' }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black text-primary uppercase tracking-widest">
                                {currentStep + 1} / {TOUR_STEPS.length}
                            </span>
                        </div>
                        <button 
                            onClick={skipTour}
                            className="text-text-muted hover:text-text-primary transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                        {step.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed mb-6">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                        <button 
                            onClick={skipTour}
                            className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                        >
                            Skip Tour
                        </button>
                        
                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button 
                                    onClick={handleBack}
                                    className="p-2 rounded-lg border border-border bg-surface-2 text-text-primary hover:bg-surface-3 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            <button 
                                onClick={handleNext}
                                className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? (
                                    <>Finish <CheckCircle2 className="w-3.5 h-3.5" /></>
                                ) : (
                                    <>Next <ChevronRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div 
                        className={`absolute w-3 h-3 bg-surface border-l border-t border-primary/30 rotate-45 ${
                            step.position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2' :
                            step.position === 'left' ? 'top-1/2 -translate-y-1/2 -right-1.5 rotate-[135deg]' : ''
                        }`}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default UserTour;
