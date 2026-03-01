import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ChevronRight, Unlock } from 'lucide-react';
import useGamificationStore from '../../store/useGamificationStore';

const LevelUpModal = () => {
    const { levelUpData, clearLevelUp } = useGamificationStore();

    useEffect(() => {
        if (levelUpData) {
            // Trigger confetti burst
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#38BDF8', '#10B981', '#F59E0B']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#38BDF8', '#10B981', '#F59E0B']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [levelUpData]);

    return (
        <AnimatePresence>
            {levelUpData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
                    {/* Dark Overlay */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                        onClick={clearLevelUp}
                    ></motion.div>

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative w-[90%] max-w-md bg-surface border border-border rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_25px_50px_rgba(0,0,0,0.6)]"
                    >
                        <div className="absolute -top-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

                        <span className="text-warning text-sm font-bold tracking-widest uppercase mb-6 drop-shadow-md">
                            Level Up!
                        </span>

                        {/* Level Ring */}
                        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-[6px] border-surface-2"></div>
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle 
                                    cx="64" cy="64" r="61" 
                                    stroke="currentColor" 
                                    strokeWidth="6" 
                                    fill="transparent" 
                                    className="text-primary"
                                    strokeDasharray="383" /* 2 * PI * r */
                                    strokeDashoffset="0"
                                    style={{ transition: "stroke-dashoffset 1s ease-out 0.5s" }}
                                />
                            </svg>
                            <span className="text-display text-5xl font-display font-bold text-text-primary drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                                {levelUpData.newLevel}
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold font-display text-text-primary mb-2">
                            You've reached Level {levelUpData.newLevel}
                        </h2>
                        <p className="text-text-secondary mb-8 text-sm">
                            Incredible focus. Your consistency is paying off.
                        </p>

                        {/* Unlocks */}
                        {levelUpData.unlockedFeatures && levelUpData.unlockedFeatures.length > 0 && (
                            <div className="w-full bg-surface-2 rounded-xl p-4 mb-8 text-left border border-border">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block">New Unlocks</span>
                                <div className="space-y-3">
                                    {levelUpData.unlockedFeatures.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                                                <Unlock className="w-4 h-4 text-success" />
                                            </div>
                                            <span className="text-sm font-medium text-text-primary">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={clearLevelUp}
                            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 group"
                        >
                            Let's Go!
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LevelUpModal;
