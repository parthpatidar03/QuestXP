import React from 'react';
import { Crown, Zap } from 'lucide-react';

const RANK_COLORS = ['oklch(0.68 0.13 78)', 'oklch(0.62 0.01 88)', 'oklch(0.56 0.08 65)', 'oklch(0.60 0.014 88)', 'oklch(0.60 0.014 88)'];
const RANK_LABELS = ['1', '2', '3', '4', '5'];

/** 
 * XPLeaderboardSidebar — shows top learners ranked by XP.
 * Pass an array of { name, totalXP, level } objects as `players`.
 * If not provided, shows a skeleton / empty state.
 */
const XPLeaderboardSidebar = ({ players = [] }) => {
    return (
        <section className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
                <Crown className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">XP leaderboard</h3>
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
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-surface-2"
                            style={i === 0 ? { background: 'oklch(0.95 0.035 78)', border: '1px solid oklch(0.84 0.065 78)' } : {}}
                        >
                            {/* Rank */}
                            <span className="text-xs font-semibold w-5 text-center shrink-0 text-text-muted">{RANK_LABELS[i]}</span>

                            {/* Avatar */}
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ background: `linear-gradient(135deg, ${RANK_COLORS[i]}, ${RANK_COLORS[i]}88)` }}
                            >
                                {p.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>

                            {/* Name + Level */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate">{p.name}</p>
                                <p className="text-xs text-text-muted">Lv {p.level}</p>
                            </div>

                            {/* XP */}
                            <div className="flex items-center gap-1 shrink-0">
                                <Zap className="w-3 h-3 text-gold" />
                                <span className="text-xs font-semibold text-text-primary">{(p.totalXP || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default XPLeaderboardSidebar;
