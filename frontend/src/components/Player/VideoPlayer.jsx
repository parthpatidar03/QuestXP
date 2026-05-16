import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ _courseId, _lectureId, youtubeId, onEnded, onTimeUpdate, startTime = 0, endTime = null, seekTo = null }) => {
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    const onEndedRef = useRef(onEnded);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    useEffect(() => {
        onEndedRef.current = onEnded;
        onTimeUpdateRef.current = onTimeUpdate;
    }, [onEnded, onTimeUpdate]);

    useEffect(() => {
        // Load YouTube IFrame API if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                createPlayer();
            };
        } else {
            createPlayer();
        }

        function createPlayer() {
            if (playerRef.current) playerRef.current.destroy();

            playerRef.current = new window.YT.Player(containerRef.current, {
                videoId: youtubeId,
                playerVars: {
                    start: startTime,
                    end: endTime,
                    rel: 0,
                    modestbranding: 1,
                    enablejsapi: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event) => {
                        setIsPlayerReady(true);
                        event.target.playVideo();
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            if (onEndedRef.current) onEndedRef.current();
                        }
                    },
                },
            });
        }

        const interval = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime && onTimeUpdateRef.current) {
                onTimeUpdateRef.current(playerRef.current.getCurrentTime());
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (playerRef.current) playerRef.current.destroy();
        };
    }, [youtubeId, startTime, endTime]);

    // Handle external seek requests via props
    useEffect(() => {
        if (seekTo && playerRef.current && playerRef.current.seekTo) {
            playerRef.current.seekTo(seekTo.time, true);
        }
    }, [seekTo]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative bg-black rounded-xl overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
            
            {!isPlayerReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
