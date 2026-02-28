import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import VideoPlayer from '../components/Player/VideoPlayer';
import TopicSidebar from '../components/Player/TopicSidebar';

const Player = () => {
    const { courseId, lectureId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await api.get(`/courses/${courseId}`);
                setCourse(data.course);
            } catch (err) {
                setError('Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    // Flatten lectures to easily find current, prev, next
    const allLectures = useMemo(() => {
        if (!course) return [];
        return course.sections.flatMap(section => section.lectures);
    }, [course]);

    const currentLectureIndex = useMemo(() => {
        return allLectures.findIndex(l => l._id === lectureId);
    }, [allLectures, lectureId]);

    const currentLecture = allLectures[currentLectureIndex];
    const prevLecture = currentLectureIndex > 0 ? allLectures[currentLectureIndex - 1] : null;
    const nextLecture = currentLectureIndex < allLectures.length - 1 ? allLectures[currentLectureIndex + 1] : null;

    if (loading) return <div className="p-8 min-h-screen bg-gray-900 text-gray-400 flex justify-center items-center">Loading Player...</div>;
    if (error || !currentLecture) return <div className="text-red-500 p-8 min-h-screen bg-gray-900">{error || 'Lecture not found'}</div>;

    const handleTopicClick = (startTime) => {
        // We'll pass this via ref or a controlled state in the future.
        // For MVP, we pass it down loosely or wait for react-youtube logic.
        // Currently the VideoPlayer iframe doesn't auto-seek.
        console.log(`Seek to ${startTime}`);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col h-screen">
            <header className="px-6 py-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center z-10">
                <div>
                    <Link className="text-sm text-gray-500 hover:text-white" to={`/courses/${courseId}`}>
                        &larr; Back to {course.title}
                    </Link>
                    <h1 className="text-xl font-bold text-yellow-400 mt-1 line-clamp-1">{currentLecture.title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => prevLecture && navigate(`/courses/${courseId}/lectures/${prevLecture._id}`)}
                        disabled={!prevLecture}
                        className="px-4 py-2 bg-gray-700 text-gray-300 font-medium rounded disabled:opacity-50 hover:bg-gray-600 transition-colors"
                    >
                        &larr; Prev
                    </button>
                    <button 
                        onClick={() => nextLecture && navigate(`/courses/${courseId}/lectures/${nextLecture._id}`)}
                        disabled={!nextLecture}
                        className="px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded disabled:opacity-50 hover:bg-yellow-300 transition-colors"
                    >
                        Next &rarr;
                    </button>
                </div>
            </header>

            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-grow p-4 lg:p-6 lg:mr-0 flex flex-col min-h-0 bg-black">
                    <div className="flex-grow max-w-6xl w-full mx-auto flex items-center justify-center">
                        <VideoPlayer 
                            courseId={courseId}
                            lectureId={lectureId}
                            youtubeId={currentLecture.youtubeId}
                        />
                    </div>
                </div>
                
                <div className="w-full lg:w-96 p-4 lg:p-6 lg:pl-0 flex-shrink-0 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 h-96 lg:h-auto overflow-y-auto">
                    <TopicSidebar 
                        topics={currentLecture.topics || []}
                        currentTime={currentTime}
                        onTopicClick={handleTopicClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default Player;
