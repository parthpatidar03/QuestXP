import useGamificationStore from '../store/useGamificationStore';
import { FEATURE_LEVELS, LEVELS } from '../constants/featureLevels';

export const useFeatureGate = (featureKey) => {
    const { unlockedFeatures, level, totalXP } = useGamificationStore();

    // If the user already has the feature unlocked directly
    if (unlockedFeatures.includes(featureKey)) {
        return { locked: false, requiredLevel: 1, xpToUnlock: 0 };
    }

    // Lookup what level is required
    const requiredLevel = FEATURE_LEVELS[featureKey] || 1;

    // Check level explicitly
    if (level >= requiredLevel) {
        return { locked: false, requiredLevel, xpToUnlock: 0 };
    }

    // Still locked, compute XP needed
    const requiredLevelObj = LEVELS.find(l => l.level === requiredLevel) || LEVELS[0];
    const xpToUnlock = Math.max(0, requiredLevelObj.threshold - totalXP);

    return {
        locked: true,
        requiredLevel,
        xpToUnlock,
        featureKey
    };
};
