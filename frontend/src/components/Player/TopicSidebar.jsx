import React from 'react';
import { Bot, List } from 'lucide-react';

const TopicSidebar = ({ topics, currentTime, onTopicClick }) => {
    // If no topics yet, show placeholder
    if (!topics || topics.length === 0) {
        return (
            <div className="bg-surface border-l border-border h-full flex flex-col">
                <div className="p-5 border-b border-border bg-surface flex items-center gap-3">
                    <List className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-base font-display font-bold text-text-primary leading-tight">Lecture Topics</h3>
                        <p className="text-xs text-text-muted mt-0.5">Jump to key moments</p>
                    </div>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                        <Bot className="w-6 h-6 text-text-muted animate-pulse" />
                    </div>
                    <p className="text-sm text-text-secondary">AI is analyzing this video.<br/>Topics will appear here shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface border-l border-border h-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border bg-surface flex items-center gap-3 shrink-0">
                <List className="w-5 h-5 text-primary" />
                <div>
                    <h3 className="text-base font-display font-bold text-text-primary leading-tight">Lecture Topics</h3>
                    <p className="text-xs text-text-muted mt-0.5">Jump to key moments</p>
                </div>
            </div>
            
            <div className="overflow-y-auto flex-grow divide-y divide-border/50 custom-scrollbar">
                {topics.map((topic, idx) => {
                    const isActive = currentTime >= topic.startTime && (idx === topics.length - 1 || currentTime < topics[idx+1].startTime);
                    
                    return (
                        <button
                            key={idx}
                            onClick={() => onTopicClick(topic.startTime)}
                            className={`w-full text-left p-4 hover:bg-surface-2 transition-colors flex gap-4 ${isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}
                        >
                            <span className={`font-mono text-xs font-semibold mt-0.5 ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                                {Math.floor(topic.startTime / 60)}:{String(topic.startTime % 60).padStart(2, '0')}
                            </span>
                            <span className={`text-sm ${isActive ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
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
