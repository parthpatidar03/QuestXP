import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/useAuthStore';
import useGamificationStore from '../../../store/useGamificationStore';
import { motion } from 'framer-motion';
import { Award, Zap, Lock, Unlock, Flame } from 'lucide-react';
import BadgeGrid from './BadgeGrid';
import XPHeatmap from './XPHeatmap';

const GamificationProfile = () => {
    const { token } = useAuthStore();
    const { setProfile, totalXP, level, levelTitle, streak } = useGamificationStore();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileData, setProfileData] = useState(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const url = import.meta.env.VITE_API_URL 
                ? `${import.meta.env.VITE_API_URL}/api/gamification/profile`
                : 'http://localhost:5000/api/gamification/profile';
                
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch gamification profile');
            
            const data = await response.json();
            setProfileData(data);
            setProfile(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchProfile();
        }
    }, [token]);

    if (loading) return <div className="p-6 text-center text-text-muted">Loading profile...</div>;
    if (error) return (
        <div className="p-6 text-center text-red-500">
            <p>{error}</p>
            <button onClick={fetchProfile} className="mt-4 px-4 py-2 bg-surface-3 rounded-lg hover:bg-surface-4 transition-colors">Retry</button>
        </div>
    );

    if (!profileData) return null;

    const progressPercentage = profileData.xpToNextLevel === 0 
        ? 100 
        : Math.min(100, (totalXP / (totalXP + profileData.xpToNextLevel)) * 100);

    return (
        <div className="bg-surface-2 border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/10 blur-xl"></div>
                        <span className="text-2xl font-black text-primary relative z-10">{level}</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary mb-1">{levelTitle}</h2>
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                            <span className="flex items-center gap-1.5 font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                                {streak.current} Day Streak
                            </span>
                            <span className="bg-surface-3 px-2 py-0.5 rounded text-text-secondary">
                                {streak.multiplier}x XP
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="text-sm text-text-muted mb-1 font-medium">Total XP</div>
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent flex items-center justify-end gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        {totalXP.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Next Level Progress */}
            {profileData.nextLevelTitle && (
                <div className="bg-surface-1 rounded-lg p-4 border border-border mb-6">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <div className="text-xs text-text-muted mb-1 hover:text-text-secondary transition-colors cursor-default">NEXT LEVEL</div>
                            <div className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                                <Lock className="w-3 h-3 text-text-muted" />
                                {profileData.nextLevelTitle}
                            </div>
                        </div>
                        <div className="text-xs font-medium text-text-secondary">
                            <span className="text-primary">{profileData.xpToNextLevel.toLocaleString()}</span> XP to go
                        </div>
                    </div>
                    
                    <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden w-full relative">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-primary to-accent rounded-full"
                        />
                    </div>
                </div>
            )}
            
            {/* Features (Sample integration) */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider">Unlocked Features</h3>
                <div className="flex flex-wrap gap-2">
                    {profileData.unlockedFeatures.length === 0 ? (
                        <span className="text-sm text-text-muted">No features unlocked yet.</span>
                    ) : (
                        profileData.unlockedFeatures.map(f => (
                            <span key={f} className="px-3 py-1.5 bg-surface-3 border border-border text-xs rounded-md text-text-primary flex items-center gap-1.5">
                                <Unlock className="w-3 h-3 text-emerald-500" />
                                {f.replace(/_/g, ' ')}
                            </span>
                        ))
                    )}
                </div>
            </div>

            <XPHeatmap />
            <BadgeGrid badges={profileData.badges} />
        </div>
    );
};

export default GamificationProfile;
