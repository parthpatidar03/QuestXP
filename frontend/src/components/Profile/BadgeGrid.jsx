import React, { useEffect } from 'react';
import { Award, Lock, Star, Shield, Zap, Medal } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

// Simple heuristic to assign icons
const getIcon = (id) => {
    if (id.includes('STREAK')) return <Zap className="w-6 h-6" />;
    if (id.includes('QUIZ')) return <Star className="w-6 h-6" />;
    if (id.includes('LEVEL')) return <Shield className="w-6 h-6" />;
    return <Award className="w-6 h-6" />;
};

const BadgeGrid = ({ badges }) => {
    const { token } = useAuthStore();

    useEffect(() => {
        // Mark as seen when component mounts
        const hasUnseen = badges.some(b => b.earned && !b.seen);
        if (hasUnseen && token) {
            const url = import.meta.env.VITE_API_URL 
                ? `${import.meta.env.VITE_API_URL}/api/gamification/badges/seen`
                : 'http://localhost:5000/api/gamification/badges/seen';
                
            fetch(url, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(err => console.error('Failed to mark badges seen', err));
        }
    }, [badges, token]);

    if (!badges || badges.length === 0) return null;

    return (
        <div className="bg-surface-2 border border-border rounded-xl p-6 mb-6">
            <h3 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider">Your Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {badges.map(badge => (
                    <div 
                        key={badge.id} 
                        className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                            badge.earned 
                                ? 'bg-surface border-warning/30 hover:border-warning/60 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                                : 'bg-surface-1 border-border/50 opacity-60 grayscale'
                        }`}
                    >
                        <div className="relative mb-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                badge.earned ? 'bg-warning/10 text-warning' : 'bg-surface-3 text-text-muted'
                            }`}>
                                {getIcon(badge.id)}
                            </div>
                            {badge.earned && !badge.seen && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                                </span>
                            )}
                        </div>
                        <h4 className={`text-xs font-bold text-center ${badge.earned ? 'text-text-primary' : 'text-text-muted mt-1'}`}>
                            {badge.name}
                        </h4>
                        {!badge.earned && (
                            <Lock className="w-3 h-3 text-text-muted mt-2" />
                        )}
                        {badge.earned && badge.earnedAt && (
                            <div className="text-[10px] text-text-muted mt-1">
                                {new Date(badge.earnedAt).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BadgeGrid;
