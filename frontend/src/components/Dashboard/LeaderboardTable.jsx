import React from 'react';
import { Flame } from 'lucide-react';
import XPCurrency from '../XPCurrency';

const LeaderboardTable = ({ players = [] }) => {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface/30 backdrop-blur-sm">
            <div className="grid grid-cols-[50px_1fr_100px_80px_80px] px-6 py-4 border-b border-border bg-surface/50 text-[10px] font-black uppercase tracking-widest text-text-muted">
                <span>Rank</span>
                <span>Learner</span>
                <span className="text-right">🪙 XP</span>
                <span className="text-right">Current</span>
                <span className="text-right">Max</span>
            </div>
            
            <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto scrollbar-thin">
                {players.map((p, i) => (
                    <div 
                        key={p._id || i}
                        className={`grid grid-cols-[50px_1fr_100px_80px_80px] px-6 py-4 items-center transition-colors hover:bg-primary/5 ${i < 3 ? 'bg-primary/5' : ''}`}
                    >
                        <span className={`text-sm font-black ${i === 0 ? 'text-gold' : i === 1 ? 'text-text-secondary' : i === 2 ? 'text-warning' : 'text-text-muted'}`}>
                            #{i + 1}
                        </span>
                        
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-bold text-text-primary shrink-0">
                                {p.name[0]}
                            </div>
                            <span className="text-sm font-bold text-text-primary truncate">{p.name}</span>
                        </div>

                        <div className="flex items-center justify-end gap-1 text-right">
                            <XPCurrency amount={p.totalXP || 0} size="sm" />
                        </div>

                        <div className="flex items-center justify-end gap-1 text-right">
                            <Flame className="w-3 h-3 text-warning" />
                            <span className="text-sm font-black text-text-primary">{p.streak?.current || 0}</span>
                        </div>

                        <span className="text-xs font-black text-text-muted text-right">
                            {p.streak?.longest || 0}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaderboardTable;
