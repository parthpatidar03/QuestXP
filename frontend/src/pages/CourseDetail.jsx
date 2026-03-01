import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, PlayCircle, Loader2, AlertOctagon, Clock, BookOpen, Layers } from 'lucide-react';

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

    if (error) return (
        <div className="min-h-screen bg-bg text-text-primary p-8 flex flex-col items-center justify-center">
            <AlertOctagon className="w-16 h-16 text-danger mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h2>
            <p className="text-text-secondary">{error}</p>
            <Link to="/dashboard" className="mt-8 btn-primary">Return to Dashboard</Link>
        </div>
    );
    
    if (!course) return (
        <div className="min-h-screen bg-bg text-text-primary p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-text-secondary font-medium">Loading course data...</p>
        </div>
    );

    if (course.status === 'processing') {
        const processed = statusData?.processedCount || 0;
        const total = statusData?.totalCount || '...';
        return (
            <div className="min-h-screen bg-bg text-text-primary p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full w-96 h-96 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                
                <div className="card max-w-lg w-full text-center relative z-10 p-10">
                    <div className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-surface-2 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                        <BookOpen className="w-8 h-8 text-primary absolute" />
                    </div>
                    
                    <h2 className="text-3xl font-display font-bold mb-3">Synthesizing Course</h2>
                    <p className="text-text-secondary mb-8 leading-relaxed">
                        We are analyzing your playlist URLs, extracting metadata, and constructing your optimal learning path. This usually takes a few seconds.
                    </p>
                    
                    <div className="bg-surface-2 rounded-xl p-4 border border-border">
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="font-semibold text-text-primary">Processing Lectures</span>
                            <span className="text-text-muted font-mono">{processed} / {total}</span>
                        </div>
                        <div className="progress-bar w-full">
                            <div className="progress-bar__fill h-full bg-primary skeleton" style={{ width: total && total !== '...' ? `${(processed/total)*100}%` : '5%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (course.status === 'error') {
        return (
            <div className="min-h-screen bg-bg text-text-primary p-8 flex flex-col items-center justify-center">
                <div className="card max-w-md w-full text-center p-10 border-danger/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <AlertOctagon className="w-16 h-16 text-danger mx-auto mb-6" />
                    <h2 className="text-2xl font-display font-bold mb-3 text-text-primary">Processing Failed</h2>
                    <p className="text-text-secondary mb-8">We could not fetch the playlists. Ensure they are public and valid YouTube URLs.</p>
                    <Link to="/dashboard" className="btn-primary w-full block">Return to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg text-text-primary p-4 md:p-8 font-body">
            <div className="max-w-5xl mx-auto">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                    Back to Library
                </Link>
                
                {/* Course Header */}
                <div className="mb-12 relative">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-text-primary mb-4 tracking-tight leading-tight max-w-3xl">
                        {course.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border">
                            <Layers className="w-4 h-4 text-primary" />
                            <span className="font-medium text-text-secondary"><strong className="text-text-primary">{course.totalLectures}</strong> Lectures</span>
                        </div>
                        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-medium text-text-secondary"><strong className="text-text-primary">{Math.floor(course.totalDuration / 60)}</strong> minutes</span>
                        </div>
                    </div>
                </div>

                {/* Course Sections */}
                <div className="space-y-6">
                    {course.sections.map((section, sIdx) => (
                        <div key={sIdx} className="card p-0 overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-surface-2 px-6 py-5 border-b border-border flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">Module {section.order + 1}</span>
                                    <h3 className="font-display font-bold text-xl text-text-primary">
                                        {section.title}
                                    </h3>
                                </div>
                                <div className="text-sm font-medium text-text-muted">
                                    {section.lectures.length} lessons
                                </div>
                            </div>
                            
                            {/* Lectures List */}
                            <div className="divide-y divide-border">
                                {section.lectures.map((lecture, lIdx) => (
                                    <Link 
                                        key={lecture.youtubeId}
                                        to={`/courses/${course._id}/lectures/${lecture._id}`}
                                        className="p-4 sm:px-6 hover:bg-surface-2/50 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors group"
                                    >
                                        <div className="hidden sm:flex items-center justify-center w-8 text-text-muted font-mono font-medium opacity-50 space-x-2">
                                            {lIdx + 1}
                                        </div>
                                        
                                        <div className="flex items-start sm:items-center gap-4 flex-1">
                                            <div className="relative flex-shrink-0 w-28 aspect-video rounded-md bg-surface-2 overflow-hidden border border-border group-hover:border-primary/50 transition-colors">
                                                {lecture.thumbnailUrl ? (
                                                    <img src={lecture.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col justify-center items-center text-text-muted">
                                                        <PlayCircle className="w-6 h-6 opacity-50" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                                {/* Play overlay on hover */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-primary/90 rounded-full p-2 shadow-lg backdrop-blur-sm">
                                                        <PlayCircle className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="font-medium text-text-primary leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                                    {lecture.title}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-text-muted">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
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
