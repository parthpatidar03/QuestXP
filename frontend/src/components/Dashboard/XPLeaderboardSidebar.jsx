import React from 'react';
import { Crown } from 'lucide-react';
import XPCurrency from '../XPCurrency';

const RANK_COLORS = ['var(--color-gold)', 'var(--color-primary)', 'var(--color-secondary)', 'var(--color-text-muted)', 'var(--color-text-muted)'];
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
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-surface-2 ${i === 0 ? 'bg-gold/10 border border-gold/30' : ''}`}
                        >
                            {/* Rank */}
                            <span className={`text-xs font-semibold w-5 text-center shrink-0 ${i === 0 ? 'text-gold' : 'text-text-muted'}`}>{RANK_LABELS[i]}</span>

                            {/* Avatar */}
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ background: RANK_COLORS[i] }}
                            >
                                {p.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>

                            {/* Name + Level */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${i === 0 ? 'text-text-primary' : 'text-text-primary'}`}>{p.name}</p>
                                <p className="text-xs text-text-muted">Level {p.level}</p>
                            </div>

                            {/* XP */}
                            <div className="shrink-0">
                                <XPCurrency amount={p.totalXP || 0} size="xs" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-leaderboard'))}
                className="w-full mt-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary-dark transition-colors border-t border-border/30 pt-4"
            >
                View Full Hall of Fame →
            </button>
        </section>
    );
};

export default XPLeaderboardSidebar;
