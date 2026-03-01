import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ courseId, lectureId, youtubeId, onEnded }) => {
    const playerRef = useRef(null);
    const [lastPosition, setLastPosition] = useState(0);

    useEffect(() => {
        setLastPosition(0);
    }, [courseId, lectureId]);

    // Added a simple placeholder button to trigger "onEnded" manually for testing the completion card,
    // since we are using a basic iframe and not the full YouTube IFrame Player API.
    // In a production app, we would use react-youtube's onEnd event.

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
            <div className="w-full aspect-video bg-black overflow-hidden ring-1 ring-white/5 shadow-2xl relative z-10">
                <iframe 
                    ref={playerRef}
                    src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&start=${lastPosition}&rel=0&modestbranding=1`}
                    title="YouTube video player"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
            
            {/* Debug/Dev button to simulate video completion */}
            {onEnded && (
                <button 
                    onClick={onEnded}
                    className="mt-8 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/50 text-xs rounded-md border border-white/10 transition-colors"
                    title="Simulate video end for testing gamification"
                >
                    [Dev] Simulate Video Completion
                </button>
            )}
        </div>
    );
};

export default VideoPlayer;
