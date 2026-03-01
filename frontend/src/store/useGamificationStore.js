import { create } from 'zustand';

const useGamificationStore = create((set, get) => ({
    // T006 State shape
    totalXP: 0,
    level: 1,
    levelTitle: 'Curious Beginner',
    streak: { current: 0, longest: 0, multiplier: 1 },
    unlockedFeatures: [],
    badges: [],

    xpToasts: [],
    badgeToasts: [],
    levelUpData: null,
    isVideoPlaying: false,

    // T006 Actions
    setProfile: (profileData) => set({
        totalXP: profileData.totalXP ?? 0,
        level: profileData.level ?? 1,
        levelTitle: profileData.levelTitle ?? 'Curious Beginner',
        streak: profileData.streak ?? { current: 0, longest: 0, multiplier: 1 },
        unlockedFeatures: profileData.unlockedFeatures ?? [],
        badges: profileData.badges ?? []
    }),

    applyAward: (award) => {
        if (award.duplicate) return;

        const { addXPToast, triggerLevelUp } = get();

        // Update core XP
        if (award.xpEarned > 0) {
            set((state) => ({ totalXP: award.totalXP ?? Math.max(0, state.totalXP + award.xpEarned) }));
            // Add Toast
            addXPToast(award.xpEarned, award.actionLabel || award.actionType || 'Bonus XP', award.multiplier || 1);
        }

        // T014: Handle level up
        if (award.leveledUp) {
            set({ 
                level: award.newLevel,
                levelTitle: award.newLevelTitle,
                unlockedFeatures: award.unlockedFeatures || get().unlockedFeatures
            });
            // Trigger sequence modal if there are multiple levelups
            if (award.levelUps && award.levelUps.length > 0) {
                triggerLevelUp(award.levelUps[0].level, award.levelUps[0].unlockedFeatures);
            } else if (award.newlyUnlocked && award.newlyUnlocked.length > 0) {
                triggerLevelUp(award.newLevel, award.newlyUnlocked);
            }
        }

        // T023: Handle badge earned notifications
        if (award.badgesEarned && award.badgesEarned.length > 0) {
            const { addBadgeToast } = get();
            award.badgesEarned.forEach(badge => {
                addBadgeToast(badge.name, 'Achievement Unlocked!', 'star');
                
                // Add to stored badges
                set(state => {
                    const existingBadges = state.badges || [];
                    // Avoid inserting duplicates
                    if (!existingBadges.find(b => b.id === badge.badgeId)) {
                        return { 
                            badges: [...existingBadges, { 
                                id: badge.badgeId, 
                                name: badge.name, 
                                earned: true, 
                                earnedAt: new Date().toISOString(), 
                                seen: false 
                            }] 
                        };
                    }
                    return state;
                });
            });
        }
    },

    // Store state from VideoPlayer to suppress toasts
    setIsVideoPlaying: (isPlaying) => set({ isVideoPlaying: isPlaying }),

    // Trigger an XP Toast
    addXPToast: (amount, reason = '', multiplier = 1) => {
        const { isVideoPlaying } = get();
        if (isVideoPlaying) return; // Suppress during video playback

        const id = Date.now().toString() + Math.random().toString();
        set((state) => ({
            xpToasts: [...state.xpToasts, { id, amount, reason, multiplier }]
        }));

        // Stacked toasts auto-dismiss handled by component or timeout here
        setTimeout(() => get().removeXPToast(id), 3000);
    },

    removeXPToast: (id) => set((state) => ({
        xpToasts: state.xpToasts.filter(toast => toast.id !== id)
    })),

    // Trigger a Badge Toast
    addBadgeToast: (title, condition, iconType = 'default') => {
        const { isVideoPlaying } = get();
        if (isVideoPlaying) return; // Suppress during video playback

        const id = Date.now().toString() + Math.random().toString();
        set((state) => ({
            badgeToasts: [...state.badgeToasts, { id, title, condition, iconType }]
        }));

        setTimeout(() => get().removeBadgeToast(id), 4000);
    },

    removeBadgeToast: (id) => set((state) => ({
        badgeToasts: state.badgeToasts.filter(toast => toast.id !== id)
    })),

    // Trigger Level Up Modal (Fullscreen)
    triggerLevelUp: (newLevel, unlockedFeatures = []) => {
        const { isVideoPlaying } = get();
        if (isVideoPlaying) return; // Suppress during video playback

        set({ levelUpData: { newLevel, unlockedFeatures } });
    },

    clearLevelUp: () => set({ levelUpData: null }),
}));

export default useGamificationStore;
