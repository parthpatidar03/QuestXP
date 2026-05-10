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

    useEffect(() => {
        if (!targetRect) return;
        
        let top = 0;
        let left = 0;
        let arrowPos = 'top';

        if (step.position === 'bottom') {
            top = targetRect.bottom + 20;
            left = Math.max(20, Math.min(window.innerWidth - 320, targetRect.left + (targetRect.width / 2) - 150));
            arrowPos = 'top';
            
            // Flip to top if it hits the bottom of the screen
            if (top + 250 > window.innerHeight) {
                top = targetRect.top - 280;
                arrowPos = 'bottom';
            }
        } else if (step.position === 'left') {
            top = targetRect.top + (targetRect.height / 2) - 100;
            left = targetRect.left - 320;
            arrowPos = 'right';

            // Ensure it doesn't go above or below
            top = Math.max(20, Math.min(window.innerHeight - 250, top));
        }

        setTooltipStyles({ top, left, arrowPos });
    }, [targetRect, step.position]);

    const [tooltipStyles, setTooltipStyles] = useState({ top: 0, left: 0, arrowPos: 'top' });

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
                    fill="rgba(0, 0, 0, 0.85)"
                    mask="url(#spotlight-mask)"
                    className="backdrop-blur-[3px]"
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
                        left: tooltipStyles.left,
                        top: tooltipStyles.top
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute w-[300px] bg-white text-slate-900 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-6 pointer-events-auto"
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
                            className="text-slate-400 hover:text-slate-900 transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                        <button 
                            onClick={skipTour}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Skip Tour
                        </button>
                        
                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button 
                                    onClick={handleBack}
                                    className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            <button 
                                onClick={handleNext}
                                className="bg-primary text-white py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
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
                        className={`absolute w-3 h-3 bg-white border-l border-t border-white rotate-45 ${
                            tooltipStyles.arrowPos === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2' :
                            tooltipStyles.arrowPos === 'bottom' ? '-bottom-1.5 left-1/2 -translate-x-1/2 rotate-[225deg]' :
                            tooltipStyles.arrowPos === 'right' ? 'top-1/2 -translate-y-1/2 -right-1.5 rotate-[135deg]' : ''
                        }`}
                    />
                </motion.div>
            </AnimatePresence>
        </div>

    );
};

export default UserTour;
