import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const CourseDetail = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [statusData, setStatusData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await api.get(`/courses/${courseId}`);
                setCourse(data.course);
            } catch (err) {
                setError('Failed to load course details.');
            }
        };

        fetchCourse();
    }, [courseId]);

    // Poll status if processing
    useEffect(() => {
        if (!course || course.status === 'ready' || course.status === 'error') return;

        const interval = setInterval(async () => {
            try {
                const { data } = await api.get(`/courses/${courseId}/status`);
                setStatusData(data);
                if (data.status === 'ready' || data.status === 'error') {
                    setCourse(prev => ({ ...prev, status: data.status }));
                    if (data.status === 'ready') {
                        // Re-fetch full course with lectures
                        const fullResponse = await api.get(`/courses/${courseId}`);
                        setCourse(fullResponse.data.course);
                    }
                }
            } catch (err) {
                console.error('Polling error', err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [course, courseId]);

    if (error) return <div className="text-red-500 p-8 min-h-screen bg-gray-900">{error}</div>;
    if (!course) return <div className="p-8 min-h-screen bg-gray-900 text-gray-400 flex justify-center items-center">Loading Course...</div>;

    if (course.status === 'processing') {
        const processed = statusData?.processedCount || 0;
        const total = statusData?.totalCount || '...';
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-yellow-400 animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold mb-2">Processing Course Metadata</h2>
                <p className="text-gray-400 text-center max-w-md">
                    We are analyzing your playlist URLs and fetching all lectures. This usually takes just a few seconds.
                </p>
                <div className="mt-6 bg-gray-800 px-6 py-3 rounded-xl border border-gray-700 font-mono">
                    <span className="text-yellow-400">{processed}</span> of <span className="text-gray-300">{total}</span> lectures processed
                </div>
            </div>
        );
    }

    if (course.status === 'error') {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-2 text-red-500">Processing Failed</h2>
                <p className="text-gray-400">We could not fetch the playlists. Ensure they are public and valid.</p>
                <Link to="/dashboard" className="mt-8 text-yellow-400 hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/dashboard" className="text-sm text-gray-500 hover:text-white mb-6 inline-block">&larr; Back to Dashboard</Link>
                
                <h1 className="text-3xl font-bold text-yellow-400 mb-2">{course.title}</h1>
                <p className="text-gray-400 mb-8">{course.totalLectures} Lectures &bull; {Math.floor(course.totalDuration / 60)} minutes</p>

                <div className="space-y-8">
                    {course.sections.map((section, sIdx) => (
                        <div key={sIdx} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                            <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                                <h3 className="font-semibold text-lg text-gray-200">
                                    Section {section.order + 1}: {section.title}
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-700">
                                {section.lectures.map((lecture, lIdx) => (
                                    <div key={lecture.youtubeId} className="p-4 hover:bg-gray-750 flex items-center gap-4 transition-colors">
                                        <div className="text-gray-500 font-mono w-6 text-center">{lIdx + 1}</div>
                                        {lecture.thumbnailUrl ? (
                                            <img src={lecture.thumbnailUrl} alt="thumbnail" className="w-24 h-16 object-cover rounded bg-gray-900" />
                                        ) : (
                                            <div className="w-24 h-16 bg-gray-900 rounded flex items-center justify-center text-xs text-gray-600">No Image</div>
                                        )}
                                        <div className="flex-grow">
                                            <h4 className="font-medium text-gray-200 line-clamp-1">{lecture.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}</p>
                                        </div>
                                        <Link 
                                            to={`/courses/${course._id}/lectures/${lecture._id}`} // Wait, we might need lecture._id
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm font-medium rounded text-yellow-400 transition-colors"
                                        >
                                            Watch
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
