import React from 'react';
import { Lock } from 'lucide-react';

/**
 * LockedFeature
 * Drop-in wrapper for any feature behind a level gate.
 * Shows the locked UI with unlock instructions instead of the feature.
 *
 * Props:
 *   requiredLevel  – number, required level to unlock
 *   currentLevel   – number, user's current level
 *   xpAway         – number, XP remaining to reach unlock level (optional)
 *   featureName    – string, human-readable feature name
 *   locked         – bool shorthand (if true, render locked UI, skip children)
 *   children       – the actual feature UI
 */
const LockedFeature = ({
    requiredLevel,
    currentLevel = 1,
    xpAway = null,
    featureName = 'This feature',
    locked = false,
    children
}) => {
    const isLocked = locked || currentLevel < requiredLevel;

    if (!isLocked) return children;

    const pct = Math.min(((currentLevel - 1) / (requiredLevel - 1)) * 100, 100);

    return (
        <div className="card relative overflow-hidden select-none">
            {/* Blurred preview of children */}
            <div className="pointer-events-none blur-[6px] opacity-30 absolute inset-0">
                {children}
            </div>

            {/* Lock overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                    <Lock className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                    <p className="text-base font-semibold font-display text-text-primary mb-1">
                        {featureName}
                    </p>
                    <p className="text-sm text-text-secondary">
                        Unlocks at Level {requiredLevel}
                        {xpAway !== null && ` · ${xpAway} XP away`}
                    </p>
                </div>

                {/* Proximity progress bar */}
                <div className="w-full max-w-[200px]">
                    <div className="progress-bar w-full">
                        <div
                            className="progress-bar__fill h-full"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-xs text-text-muted mt-1.5 text-right font-mono">
                        Lvl {currentLevel} / {requiredLevel}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LockedFeature;
