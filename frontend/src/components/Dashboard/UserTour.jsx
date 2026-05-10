import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';

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
    const { user, setUser } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(-1);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState(null);

    const startTour = () => {
        const completed = user?.tourCompleted;
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
        const handleKeyDown = (e) => {
            if (e.shiftKey && e.key === 'T') {
                setCurrentStep(0);
                setIsVisible(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        // Wait for scrolling to finish before updating rect
        const timer = setTimeout(updateTargetRect, 300);
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect);
        };
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

    const completeTour = async () => {
        setIsVisible(false);
        setCurrentStep(-1);
        try {
            const { data } = await api.patch('/auth/tour-complete');
            if (data.user) setUser(data.user);
        } catch (err) {
            console.error('Failed to mark tour as complete', err);
        }
    };
    const step = currentStep >= 0 ? TOUR_STEPS[currentStep] : null;
    const [tooltipStyles, setTooltipStyles] = useState({ top: 0, left: 0, arrowPos: 'top' });

    useEffect(() => {
        if (!targetRect || !step) return;

        
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
    }, [targetRect, step?.position]);


    if (!isVisible || !targetRect || !step) return null;


    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Spotlight Overlay */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
                onClick={skipTour}
                style={{
                    maskImage: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px, black ${Math.max(targetRect.width, targetRect.height) / 2 + 21}px)`,
                    WebkitMaskImage: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px, black ${Math.max(targetRect.width, targetRect.height) / 2 + 21}px)`
                }}
            />

            {/* Highlight Border */}
            <motion.div
                initial={false}
                animate={{
                    left: targetRect.left - 8,
                    top: targetRect.top - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    opacity: 1
                }}
                className="absolute border-2 border-white/50 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] z-[10000]"
            />


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
                    className="absolute w-[300px] bg-slate-900/90 backdrop-blur-md text-white border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl p-6 pointer-events-auto"
                    style={{ position: 'fixed' }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                                Step {currentStep + 1} of {TOUR_STEPS.length}
                            </span>
                        </div>
                        <button 
                            onClick={skipTour}
                            className="text-white/40 hover:text-white transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">
                        {step.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed mb-6">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                        <button 
                            onClick={skipTour}
                            className="text-xs font-bold text-white/40 hover:text-white transition-colors"
                        >
                            Skip
                        </button>
                        
                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button 
                                    onClick={handleBack}
                                    className="p-2 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            <button 
                                onClick={handleNext}
                                className="bg-white text-slate-950 py-2.5 px-5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl shadow-white/10 hover:bg-slate-100 active:scale-95 transition-all"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? (
                                    <>FINISH <CheckCircle2 className="w-3.5 h-3.5" /></>
                                ) : (
                                    <>NEXT <ChevronRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div 
                        className={`absolute w-3 h-3 bg-slate-900/90 border-l border-t border-white/20 rotate-45 ${
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
