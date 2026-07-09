import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Crown, Info } from 'lucide-react';
import LeaderboardPodium from './LeaderboardPodium';
import LeaderboardTable from './LeaderboardTable';
import useFocusTrap from '../../hooks/useFocusTrap';

const GlobalLeaderboardModal = ({ isOpen, onClose, players = [], onShowXPSystem }) => {
    const trapRef = useFocusTrap(isOpen, onClose);
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                onClick={onClose}
            />
            <motion.div
                ref={trapRef}
                role="dialog"
                aria-modal="true"
                aria-label="Global leaderboard"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl h-[90vh] bg-surface border border-border rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl z-10"
            >
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-border flex items-center justify-between shrink-0 bg-surface/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                            <Crown className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-text-primary">
                                Global Hall of Fame
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">Top {players.length} Learners</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onShowXPSystem}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 text-xs font-black uppercase tracking-widest"
                        >
                            <Info className="w-4 h-4" />
                            How XP Works
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 scrollbar-thin">
                    <section>
                        <LeaderboardPodium players={players.slice(0, 3)} />
                    </section>

                    <section>
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">Rankings</h3>
                        </div>
                        <LeaderboardTable players={players} />
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-surface/50 text-center shrink-0">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                        Updates every hour • Keep learning to stay on top
                    </p>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default GlobalLeaderboardModal;
