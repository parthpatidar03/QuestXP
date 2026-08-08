import React, { useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
import XPCurrency from '../XPCurrency';

const LeaderboardTable = ({ players = [] }) => {
    const meRef = useRef(null);

    // Bring the viewer's own row into view once the list lands, so a rank
    // deep in the table doesn't require scrolling to find.
    useEffect(() => {
        if (!meRef.current) return;
        const id = setTimeout(() => {
            meRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 350);
        return () => clearTimeout(id);
    }, [players]);

    return (
        <div className="w-full overflow-hidden rounded-clay-lg clay backdrop-blur-sm">
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
                        ref={p.isMe ? meRef : undefined}
                        className={`grid grid-cols-[50px_1fr_100px_80px_80px] px-6 py-4 items-center transition-colors hover:bg-primary/5 ${
                            p.isMe ? 'bg-primary/15 ring-1 ring-inset ring-primary/40' : i < 3 ? 'bg-primary/5' : ''
                        }`}
                    >
                        {/* Rank comes from the server — the array index would be
                            wrong the moment the list is sliced or filtered. */}
                        <span className={`text-sm font-black ${i === 0 ? 'text-gold' : i === 1 ? 'text-text-secondary' : i === 2 ? 'text-warning' : 'text-text-muted'}`}>
                            #{p.rank ?? i + 1}
                        </span>

                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full clay-sunk flex items-center justify-center text-xs font-bold text-text-primary shrink-0">
                                {(p.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-text-primary truncate">{p.name}</span>
                            {p.isMe && (
                                <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest">
                                    You
                                </span>
                            )}
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
