import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Award, Medal, Star } from 'lucide-react';
import useGamificationStore from '../../store/useGamificationStore';

const getIcon = (type) => {
    switch (type) {
        case 'shield': return <Shield className="w-5 h-5 text-warning" />;
        case 'medal': return <Medal className="w-5 h-5 text-warning" />;
        case 'star': return <Star className="w-5 h-5 text-warning" />;
        default: return <Award className="w-5 h-5 text-warning" />;
    }
};

const BadgeToastOverlay = () => {
    const { badgeToasts } = useGamificationStore();

    return (
        <div className="fixed bottom-6 left-6 z-[9000] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {badgeToasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, x: -20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-surface border border-warning/30 rounded-xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center gap-4 w-max"
                    >
                        <div className="w-10 h-10 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center flex-shrink-0">
                            {getIcon(toast.iconType)}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-warning mb-0.5">Badge Earned!</p>
                            <p className="text-sm font-semibold text-text-primary leading-tight">{toast.title}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{toast.condition}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default BadgeToastOverlay;
