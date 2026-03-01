import React from 'react';
import { Lock } from 'lucide-react';
import { useFeatureGate } from '../hooks/useFeatureGate';

const LockedFeature = ({ featureKey, children, featureName = '' }) => {
    const { locked, requiredLevel, xpToUnlock } = useFeatureGate(featureKey);

    const displayName = featureName || featureKey.replace(/_/g, ' ');

    if (!locked) {
        return <>{children}</>;
    }

    return (
        <div className="relative group rounded-xl overflow-hidden pointer-events-auto">
            {/* The actual children are rendered behind the lock, blurred and disabled */}
            <div className="opacity-30 blur-[2px] pointer-events-none select-none transition-all duration-300">
                {children}
            </div>
            
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg/60 backdrop-blur-sm p-6 text-center border items-center justify-center border-border rounded-xl">
                <div className="w-12 h-12 rounded-full bg-surface-3 border border-border flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5 text-text-muted" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Feature Locked</h3>
                <p className="text-sm text-text-muted mb-4 max-w-xs">
                    <span className="font-semibold text-text-secondary">{displayName}</span> unlocks at <span className="font-bold text-primary">Level {requiredLevel}</span>.
                </p>
                <div className="w-full max-w-[200px]">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-text-muted">XP Required</span>
                        <span className="font-bold text-primary">{xpToUnlock.toLocaleString()} XP</span>
                    </div>
                    <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-surface-4 w-1/4 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LockedFeature;
