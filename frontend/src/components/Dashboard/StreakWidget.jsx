import React from 'react';

const StreakWidget = ({ streak }) => {
    if (!streak) return null;

    const { current, longest, freezeTokens } = streak;
    const isActive = current > 0;

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background glowing effect */}
            {isActive && <div className="absolute inset-0 bg-orange-500/10 opacity-50 blur-xl rounded-xl pointer-events-none"></div>}

            <h2 className="text-lg font-medium text-gray-400 mb-1 z-10 w-full text-center">Current Streak</h2>
            
            <div className="flex items-center justify-center gap-3 z-10 my-2">
                <span className={`text-5xl ${isActive ? 'text-orange-400 drop-shadow-md shadow-orange-500' : 'text-gray-600'}`}>
                    🔥
                </span>
                <p className={`text-4xl font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {current} <span className="text-base font-normal text-gray-500 ml-1">days</span>
                </p>
            </div>

            <div className="flex justify-between w-full mt-4 text-xs font-medium z-10 border-t border-gray-700/50 pt-3">
                <div className="text-left">
                    <span className="text-gray-500 block">Longest</span>
                    <span className="text-gray-300 font-mono">{longest || 0} days</span>
                </div>
                {freezeTokens > 0 && (
                    <div className="text-right">
                        <span className="text-blue-400 block">❄️ Freezes</span>
                        <span className="text-blue-300 font-mono">{freezeTokens} leftover</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreakWidget;
