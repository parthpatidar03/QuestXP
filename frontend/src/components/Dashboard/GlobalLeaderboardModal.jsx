import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Crown, Info, Flame } from 'lucide-react';
import LeaderboardPodium from './LeaderboardPodium';
import LeaderboardTable from './LeaderboardTable';
import XPCurrency from '../XPCurrency';
import useFocusTrap from '../../hooks/useFocusTrap';

const GlobalLeaderboardModal = ({ isOpen, onClose, players = [], me, totalPlayers, onShowXPSystem }) => {
    const trapRef = useFocusTrap(isOpen, onClose);
    if (!isOpen) return null;

    const inTop = me && players.some(p => p.isMe);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-bg/80 backdrop-blur-xl"
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
                className="relative w-full max-w-4xl h-[90vh] clay rounded-clay-xl flex flex-col overflow-hidden z-10"
            >
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-border flex items-center justify-between shrink-0 bg-surface/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-clay bg-gold/10 flex items-center justify-center border border-gold/20">
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
                            className="flex items-center gap-2 px-4 py-2 rounded-clay bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 text-xs font-black uppercase tracking-widest"
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

                {/* Your standing — pinned above the scroll area so nobody has
                    to hunt through a hundred rows to find their own rank. */}
                {me && (
                    <div className="px-6 sm:px-8 py-4 border-b border-border bg-primary/5 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="shrink-0 text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">You</p>
                                <p className="text-xl font-black text-primary leading-tight">#{me.rank}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full clay-sunk flex items-center justify-center text-sm font-bold text-text-primary shrink-0">
                                {(me.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-text-primary truncate">{me.name}</p>
                                <p className="text-[11px] font-semibold text-text-muted">
                                    {totalPlayers ? `Rank ${me.rank} of ${totalPlayers}` : `Level ${me.level || 1}`}
                                    {!inTop && ' · keep going to reach the top 100'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">XP</p>
                                    <XPCurrency amount={me.totalXP || 0} size="sm" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Streak</p>
                                    <span className="flex items-center gap-1 justify-end text-sm font-black text-text-primary">
                                        <Flame className="w-3.5 h-3.5 text-warning" />
                                        {me.streak?.current || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
