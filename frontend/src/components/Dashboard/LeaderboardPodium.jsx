import React from 'react';
import { Trophy, Crown, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import XPCurrency from '../XPCurrency';

const LeaderboardPodium = ({ players = [] }) => {
    if (players.length === 0) return null;

    // Podium indices: [1, 0, 2] -> Rank 2 (Left), Rank 1 (Center), Rank 3 (Right)
    const podiumIndices = [1, 0, 2];
    const topThree = podiumIndices.map(index => players[index]).filter(Boolean);

    return (
        <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 pt-12 pb-4">
            {topThree.map((player, index) => {
                const rank = players.indexOf(player) + 1;
                const isFirst = rank === 1;
                const isSecond = rank === 2;

                return (
                    <motion.div
                        key={player._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col items-center"
                    >
                        {/* Trophy / Icon */}
                        <div className={`relative mb-3 ${isFirst ? 'scale-125 -translate-y-4' : 'scale-100'}`}>
                            {isFirst && <Crown className="w-10 h-10 text-gold absolute -top-8 left-1/2 -translate-x-1/2 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />}
                            <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 ${
                                isFirst ? 'border-gold bg-gold/20' : 
                                isSecond ? 'border-text-muted bg-text-muted/20' : 
                                'border-warning bg-warning/20'
                            }`}>
                                <Trophy className={`w-8 h-8 sm:w-12 sm:h-12 ${
                                    isFirst ? 'text-gold' : 
                                    isSecond ? 'text-text-muted' : 
                                    'text-warning'
                                }`} />
                            </div>
                        </div>

                        {/* Player Card */}
                        <div className={`
                            relative flex flex-col items-center p-3 sm:p-5 rounded-t-2xl border-x border-t border-border/50 backdrop-blur-md
                            ${isFirst ? 'w-32 sm:w-48 h-40 sm:h-60 bg-gold/10 border-gold/30' : 'w-28 sm:w-40 h-32 sm:h-48 bg-surface/50'}
                        `}>
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-3 overflow-hidden shadow-inner">
                                <span className="text-xs sm:text-base font-bold uppercase text-text-primary">{player.name[0]}</span>
                            </div>
                            <span className="text-xs sm:text-base font-bold text-text-primary truncate w-full text-center px-1 mb-2">{player.name}</span>
                            <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-1">
                                    <XPCurrency amount={player.totalXP || 0} size="xs" />
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Flame className="w-2.5 h-2.5 text-warning" />
                                        <span className="text-[9px] font-bold text-text-secondary">{player.streak?.current || 0}</span>
                                    </div>
                                    <div className="w-[1px] h-2 bg-border/50" />
                                    <span className="text-[8px] font-black text-text-muted uppercase">Max {player.streak?.longest || 0}</span>
                                </div>
                            </div>

                            {/* Rank Badge */}
                            <div className={`
                                absolute -bottom-4 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg
                                ${isFirst ? 'bg-gold text-[#1a1a1a]' : isSecond ? 'bg-text-muted text-surface' : 'bg-warning text-[#1a1a1a]'}
                            `}>
                                #{rank}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default LeaderboardPodium;
