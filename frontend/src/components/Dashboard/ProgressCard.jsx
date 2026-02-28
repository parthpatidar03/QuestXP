import React from 'react';
import { Link } from 'react-router-dom';

const ProgressCard = ({ progress, course }) => {
    if (!course) return null;
    
    // Find the last accessed lecture for "Continue" button
    let continueLink = `/courses/${course._id}`;
    let lastLectureTitle = "Start Course";

    if (progress && progress.lectureProgress && progress.lectureProgress.length > 0) {
        // Sort by lastAccessedAt
        const sorted = [...progress.lectureProgress].sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));
        const lastProg = sorted[0];
        continueLink = `/courses/${course._id}/lectures/${lastProg.lecture}`;
        
        // Find title side-effect mapping (since progress doc doesn't store titles, we lookup from course)
        if (course.sections) {
            for (const section of course.sections) {
                const lec = section.lectures.find(l => l._id === lastProg.lecture);
                if (lec) lastLectureTitle = "Continue: " + lec.title;
            }
        }
    } else if (course.sections && course.sections.length > 0 && course.sections[0].lectures.length > 0) {
        continueLink = `/courses/${course._id}/lectures/${course.sections[0].lectures[0]._id}`;
    }

    const completionPct = progress ? progress.completionPct : 0;

    return (
        <div className="bg-gray-800 border-l-4 border-yellow-400 p-4 rounded-r-xl shadow-md mb-4 flex justify-between items-center bg-gradient-to-r from-gray-800 to-gray-850">
            <div>
                <h3 className="text-white font-bold mb-1 truncate">{course.title}</h3>
                <p className="text-gray-400 text-sm truncate max-w-xs">{lastLectureTitle}</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-yellow-400">{completionPct}%</p>
                    <p className="text-xs text-gray-500">Completed</p>
                </div>
                
                <Link to={continueLink} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 py-2 font-bold rounded-lg transition-colors text-sm whitespace-nowrap">
                    Continue
                </Link>
            </div>
        </div>
    );
};

export default ProgressCard;
