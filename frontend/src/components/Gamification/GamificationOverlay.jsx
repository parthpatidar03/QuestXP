import React from 'react';
import XPToastOverlay from './XPToastOverlay';
import BadgeToastOverlay from './BadgeToastOverlay';
import LevelUpModal from './LevelUpModal';

const GamificationOverlay = () => {
    return (
        <>
            <XPToastOverlay />
            <BadgeToastOverlay />
            <LevelUpModal />
        </>
    );
};

export default GamificationOverlay;
