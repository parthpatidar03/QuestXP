import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';

const ProgressCard = ({ progress, course }) => {
    if (!course) return null;
    
    let continueLink = `/courses/${course._id}`;
    let lastLectureTitle = "Start Course";

    if (progress && progress.lectureProgress && progress.lectureProgress.length > 0) {
        const sorted = [...progress.lectureProgress].sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));
        const lastProg = sorted[0];
        continueLink = `/courses/${course._id}/lectures/${lastProg.lecture}`;
        
        if (course.sections) {
            for (const section of course.sections) {
                const lec = section.lectures.find(l => l._id === lastProg.lecture);
                if (lec) lastLectureTitle = lec.title;
            }
        }
    } else if (course.sections && course.sections.length > 0 && course.sections[0].lectures.length > 0) {
        continueLink = `/courses/${course._id}/lectures/${course.sections[0].lectures[0]._id}`;
    }

    const completionPct = progress ? progress.completionPct : 0;

    return (
        <div className="card p-4 flex justify-between items-center group relative overflow-hidden">
            {/* subtle background glow indicating active state */}
            <div className="absolute top-0 left-0 w-1 h-full bg-primary group-hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-shadow"></div>

            <div className="flex-1 pr-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 block">Up Next</span>
                <h3 className="text-text-primary font-semibold mb-1 truncate text-sm">{course.title}</h3>
                <p className="text-text-secondary text-xs truncate max-w-[200px] sm:max-w-xs">{lastLectureTitle}</p>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-lg font-display font-bold text-primary leading-none">{completionPct}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted">Done</span>
                </div>
                
                <Link to={continueLink} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors" title="Continue">
                    <PlayCircle className="w-6 h-6" />
                </Link>
            </div>
        </div>
    );
};

export default ProgressCard;
