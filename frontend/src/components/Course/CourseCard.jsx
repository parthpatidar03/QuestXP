import React from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle, Clock, AlertTriangle, Image as ImageIcon } from 'lucide-react';

const CourseCard = ({ course }) => {
    const isProcessing = course.status === 'processing';
    const isError = course.status === 'error';
    
    // Fallbacks
    const completionPct = course.completionPct || 0;
    const totalLectures = course.totalLectures || 0;

    return (
        <div className="card group flex flex-col items-start h-full p-0 overflow-hidden relative transition-all duration-150 hover:shadow-lg hover:shadow-primary/5">
            {/* Thumbnail Placeholder */}
            <div className="w-full h-32 bg-surface-2 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent z-10"></div>
                {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                ) : (
                    <ImageIcon className="w-8 h-8 text-border z-0" />
                )}
                {/* Status Badges */}
                <div className="absolute top-3 left-3 z-20 flex gap-2">
                    {isProcessing && <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-sm backdrop-blur-md">Processing</span>}
                    {isError && <span className="text-[10px] font-bold uppercase tracking-wider bg-danger/20 text-danger border border-danger/30 px-2 py-0.5 rounded-sm backdrop-blur-md">Error</span>}
                </div>
            </div>

            <div className="p-5 flex-1 w-full flex flex-col">
                <h3 className="text-base font-display font-semibold text-text-primary line-clamp-2 mb-4 leading-snug group-hover:text-primary transition-colors" title={course.title}>
                    {course.title}
                </h3>
                
                <div className="mt-auto">
                    {/* Section Progress */}
                    <div className="flex justify-between items-center mb-2 text-xs text-text-muted">
                        <span className="font-medium text-text-secondary">{totalLectures} Lectures</span>
                        <span>{completionPct}%</span>
                    </div>
                    <div className="progress-bar w-full mb-5">
                        <div className={`progress-bar__fill h-full ${completionPct === 100 ? 'progress-bar__fill--complete' : ''}`} style={{ width: `${completionPct}%` }}></div>
                    </div>

                    {isProcessing ? (
                        <button disabled className="w-full py-2 bg-surface-2 text-text-muted text-sm font-semibold rounded-md border border-border cursor-not-allowed">
                            Preparing Course...
                        </button>
                    ) : isError ? (
                        <button disabled className="w-full py-2 bg-danger/10 text-danger text-sm font-semibold rounded-md border border-danger/20 cursor-not-allowed">
                            Failed to Load
                        </button>
                    ) : (
                        <Link to={`/courses/${course._id}`} className="w-full flex justify-center items-center gap-2 py-2.5 bg-surface-2 group-hover:bg-primary text-text-primary group-hover:text-white text-sm font-semibold rounded-md border border-border group-hover:border-primary transition-all">
                            <Play className="w-4 h-4 fill-current" />
                            Start Learning
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
