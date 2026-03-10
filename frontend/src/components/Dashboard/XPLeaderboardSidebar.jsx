import React from 'react';
import { Crown, Zap } from 'lucide-react';

const RANK_COLORS = ['#f5a524', '#94a3b8', '#cd7c3c', '#8b9cc8', '#8b9cc8'];
const RANK_LABELS = ['🥇', '🥈', '🥉', '4th', '5th'];

/** 
 * XPLeaderboardSidebar — shows top learners ranked by XP.
 * Pass an array of { name, totalXP, level } objects as `players`.
 * If not provided, shows a skeleton / empty state.
 */
const XPLeaderboardSidebar = ({ players = [] }) => {
    return (
        <section className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
                <Crown className="w-4 h-4 text-[#f5a524]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8b9cc8]">XP Leaderboard</h3>
            </div>

            {players.length === 0 ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-6 h-6 skeleton rounded-full" />
                            <div className="flex-1 h-4 skeleton rounded" />
                            <div className="w-12 h-4 skeleton rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {players.slice(0, 5).map((p, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[#12152a]"
                            style={i === 0 ? { background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.2)' } : {}}
                        >
                            {/* Rank */}
                            <span className="text-base w-5 text-center shrink-0">{RANK_LABELS[i]}</span>

                            {/* Avatar */}
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ background: `linear-gradient(135deg, ${RANK_COLORS[i]}, ${RANK_COLORS[i]}88)` }}
                            >
                                {p.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>

                            {/* Name + Level */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                                <p className="text-xs" style={{ color: '#4a5480' }}>Lv {p.level}</p>
                            </div>

                            {/* XP */}
                            <div className="flex items-center gap-1 shrink-0">
                                <Zap className="w-3 h-3 text-[#f5a524]" />
                                <span className="text-xs font-bold text-[#f5a524]">{(p.totalXP || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default XPLeaderboardSidebar;
