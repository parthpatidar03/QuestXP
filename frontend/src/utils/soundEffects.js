/**
 * soundEffects.js
 * Centralized utility for gamified audio cues (Duolingo style).
 */

const SOUNDS = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // satisfying pop click
    correct: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav', // celebratory ding chime
    incorrect: 'https://assets.mixkit.co/active_storage/sfx/951/951-84.wav', // low buzz/error sound
    levelup: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-84.wav', // majestic victory chime
    xp: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-84.wav' // energetic points ding
};

// Cache audio objects to avoid delay on subsequent plays
const audioCache = {};

export const playSound = (type) => {
    if (!SOUNDS[type]) {
        console.warn(`Sound type "${type}" not found.`);
        return;
    }

    try {
        let audio;
        if (audioCache[type]) {
            audio = audioCache[type];
            audio.currentTime = 0; // Rewind to start
        } else {
            audio = new Audio(SOUNDS[type]);
            // Preload loosely
            audio.preload = 'auto';
            audioCache[type] = audio;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Autoplay policy might block it until user interaction
                console.warn("Audio playback prevented by browser policy:", error);
            });
        }
    } catch (e) {
        console.error("Error playing sound:", e);
    }
};
