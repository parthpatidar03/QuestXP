import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
    const isProcessing = course.status === 'processing';
    const isError = course.status === 'error';
    
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm hover:border-gray-600 transition-colors flex flex-col items-start h-full">
            <div className="flex justify-between w-full mb-3">
                <h3 className="text-lg font-bold text-white line-clamp-1 truncate mr-2" title={course.title}>
                    {course.title}
                </h3>
                {isProcessing && <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/50 px-2 py-1 rounded whitespace-nowrap">Processing</span>}
                {!isProcessing && !isError && <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/50 px-2 py-1 rounded whitespace-nowrap">Ready</span>}
                {isError && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-1 rounded whitespace-nowrap">Error</span>}
            </div>
            
            <div className="text-sm text-gray-400 mb-4 flex-grow w-full">
                <div className="flex justify-between items-center mb-1">
                    <span>{course.totalLectures} Lectures</span>
                    <span>{course.completionPct || 0}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${course.completionPct || 0}%` }}></div>
                </div>
            </div>
            
            {isProcessing ? (
                <button disabled className="w-full py-2 bg-gray-700 text-gray-500 font-medium rounded cursor-not-allowed">
                    Processing Metadata...
                </button>
            ) : isError ? (
                <button disabled className="w-full py-2 bg-red-500/20 text-red-400 font-medium rounded cursor-not-allowed">
                    Failed to Load
                </button>
            ) : (
                <Link to={`/courses/${course._id}`} className="w-full py-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 text-center transition-colors">
                    Start Learning
                </Link>
            )}
        </div>
    );
};

export default CourseCard;
