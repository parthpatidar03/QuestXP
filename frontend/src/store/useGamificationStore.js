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
        // T011 / T014 implementation will go here
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
