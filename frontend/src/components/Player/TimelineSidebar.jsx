import React from 'react';
import { Play, CheckCircle2, Lock, Clock, List } from 'lucide-react';
import { motion } from 'framer-motion';

const TimelineSidebar = ({ allLectures, currentLectureId, completedLectures = [], onLectureClick, courseId }) => {
    const completedSet = new Set(completedLectures);

    return (
        <div className="bg-surface h-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border bg-surface flex items-center gap-3 shrink-0">
                <List className="w-5 h-5 text-primary" />
                <div>
                    <h3 className="text-base font-display font-bold text-text-primary leading-tight">Course Timeline</h3>
                    <p className="text-xs text-text-muted mt-0.5">{allLectures.length} Missions in total</p>
                </div>
            </div>
            
            <div className="overflow-y-auto lg:overflow-y-auto flex-grow divide-y divide-border/50 custom-scrollbar lg:h-0">
                {allLectures.map((lecture, idx) => {
                    const isCurrent = lecture._id === currentLectureId;
                    const isCompleted = completedSet.has(lecture._id);

                    return (
                        <button
                            key={lecture._id}
                            onClick={() => onLectureClick(lecture._id)}
                            className={`w-full text-left p-4 hover:bg-surface-2 transition-all flex items-start gap-4 group relative ${
                                isCurrent ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                            }`}
                        >
                            <div className="relative shrink-0 mt-0.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                    isCurrent ? 'bg-primary text-black' : 
                                    isCompleted ? 'bg-success/20 text-success' : 'bg-surface-3 text-text-muted'
                                }`}>
                                    {isCurrent ? <Play className="w-4 h-4 fill-current" /> : 
                                     isCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                                     <span className="text-[10px] font-black">{idx + 1}</span>}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold leading-snug line-clamp-2 transition-colors ${
                                    isCurrent ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'
                                }`}>
                                    {lecture.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-text-muted">
                                        <Clock className="w-3 h-3" />
                                        {Math.floor(lecture.duration / 60)}m
                                    </div>
                                    {lecture.type && (
                                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-3 text-text-muted border border-border/50">
                                            {lecture.type}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {isCurrent && (
                                <motion.div 
                                    layoutId="active-indicator"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelineSidebar;
