import React from 'react';
import { Play, CheckCircle2, Lock, Clock, List } from 'lucide-react';
import { motion } from 'framer-motion';

const TimelineSidebar = ({ allLectures, currentLectureId, completedLectures = [], onLectureClick, onToggleComplete, courseId }) => {
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
                        <div
                            key={lecture._id}
                            className={`w-full flex items-start gap-3 p-4 hover:bg-surface-2 transition-all group relative border-l-2 ${
                                isCurrent ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'
                            }`}
                        >
                            {/* Interactive Checkbox */}
                            <div className="shrink-0 mt-0.5">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleComplete?.(lecture._id, isCompleted);
                                    }}
                                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                                        isCompleted 
                                            ? 'bg-success border-success text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                            : 'border-border bg-surface-3 hover:border-primary/50'
                                    }`}
                                >
                                    {isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                                </button>
                            </div>

                            <button
                                onClick={() => onLectureClick(lecture._id)}
                                className="flex-1 text-left min-w-0"
                            >
                                <h4 className={`text-sm font-bold leading-snug line-clamp-2 transition-colors ${
                                    isCurrent ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'
                                }`}>
                                    <span className="text-[10px] text-text-muted mr-2 font-mono">{String(idx + 1).padStart(2, '0')}</span>
                                    {lecture.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-text-muted">
                                        <Clock className="w-3 h-3" />
                                        {Math.floor(lecture.duration / 60)}m
                                    </div>
                                    {isCurrent && (
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 animate-pulse">
                                            Watching
                                        </span>
                                    )}
                                </div>
                            </button>

                            {isCurrent && (
                                <motion.div 
                                    layoutId="active-indicator"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelineSidebar;
