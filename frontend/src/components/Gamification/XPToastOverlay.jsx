import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import useGamificationStore from '../../store/useGamificationStore';

const XPToastOverlay = () => {
    const { xpToasts } = useGamificationStore();

    return (
        <div className="fixed bottom-6 right-6 z-[9000] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {xpToasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="bg-surface-2 border border-primary/40 rounded-xl px-4 py-3 shadow-[0_0_20px_rgba(56,189,248,0.2)] flex items-center gap-3 w-max self-end"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-text-primary m-0 flex items-center gap-1.5">
                                +{toast.amount} XP 
                                {toast.multiplier > 1 && <span className="text-xs text-primary bg-primary/10 px-1.5 rounded">× {toast.multiplier}</span>}
                            </p>
                            {toast.reason && <p className="text-xs text-text-muted mt-0.5">{toast.reason}</p>}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default XPToastOverlay;
