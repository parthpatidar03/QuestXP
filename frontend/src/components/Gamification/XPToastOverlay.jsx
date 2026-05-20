import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import useGamificationStore from '../../store/useGamificationStore';
import { playSound } from '../../utils/soundEffects';

const ToastItem = ({ toast }) => {
    useEffect(() => {
        playSound('xp');
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-surface-2 border-2 border-gold rounded-xl px-4 py-3 shadow-[0_4px_0_rgba(230,180,0,1)] flex items-center gap-3 w-max self-end mb-2"
        >
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-gold" />
            </div>
            <div>
                <p className="text-sm font-bold text-text-primary m-0 flex items-center gap-1.5">
                    +{toast.amount} XP 
                    {toast.multiplier > 1 && <span className="text-xs text-gold bg-gold/10 px-1.5 rounded">× {toast.multiplier}</span>}
                </p>
                {toast.reason && <p className="text-xs text-text-muted mt-0.5 font-semibold">{toast.reason}</p>}
            </div>
        </motion.div>
    );
};

const XPToastOverlay = () => {
    const { xpToasts } = useGamificationStore();

    return (
        <div className="fixed bottom-6 right-6 z-[9000] flex flex-col pointer-events-none">
            <AnimatePresence>
                {xpToasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default XPToastOverlay;
