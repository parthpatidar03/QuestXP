import React from 'react';

const DoubtCitation = ({ timestamp, label }) => {
    // Mocking seekTo since the actual useYouTubePlayer Hook from Phase 1 might not be ready
    const seekTo = (ts) => {
        console.log(`[DoubtCitation] Mock seeking YouTube player to ${ts} seconds.`);
        // In full implementation, this calls: const { seekTo } = useYouTubePlayer();
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `[${m}:${s.toString().padStart(2, '0')}]`;
    };

    return (
        <button 
            onClick={() => seekTo(timestamp)}
            className="inline-flex items-center px-2 py-0.5 mx-1 rounded text-xs font-mono bg-indigo-900 text-indigo-200 hover:bg-indigo-800 transition-colors cursor-pointer border border-indigo-700"
            title={label}
        >
            {formatTime(timestamp)}
        </button>
    );
};

export default DoubtCitation;
