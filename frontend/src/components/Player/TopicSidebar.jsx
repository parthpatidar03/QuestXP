import React from 'react';

const TopicSidebar = ({ topics, currentTime, onTopicClick }) => {
    // If no topics yet, show placeholder
    if (!topics || topics.length === 0) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-200 mb-4">Topics</h3>
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 text-center space-y-3">
                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p className="text-sm">AI is analyzing this video.<br/>Topics will appear here shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                <h3 className="text-lg font-bold text-white">Topics</h3>
                <p className="text-xs text-gray-400 mt-1">Jump to key moments</p>
            </div>
            
            <div className="overflow-y-auto flex-grow divide-y divide-gray-700/50">
                {topics.map((topic, idx) => {
                    const isActive = currentTime >= topic.startTime && (idx === topics.length - 1 || currentTime < topics[idx+1].startTime);
                    
                    return (
                        <button
                            key={idx}
                            onClick={() => onTopicClick(topic.startTime)}
                            className={`w-full text-left p-4 hover:bg-gray-750 transition-colors flex gap-3 ${isActive ? 'bg-gray-700/50 border-l-4 border-yellow-400' : 'border-l-4 border-transparent'}`}
                        >
                            <span className={`font-mono text-sm mt-0.5 ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                                {Math.floor(topic.startTime / 60)}:{String(topic.startTime % 60).padStart(2, '0')}
                            </span>
                            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                {topic.title}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default TopicSidebar;
