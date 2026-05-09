import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle, Sparkles, ChevronDown, ChevronRight, Check, Zap } from 'lucide-react';
import { format, addDays } from 'date-fns';
import api from '../../services/api';
import { generateRoadmap } from '../../services/roadmapApi';

const GenerateRoadmapModal = ({ isOpen, onClose, onGenerated, courseId = null }) => {
    const [courses, setCourses] = useState([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [selectedSectionIds, setSelectedSectionIds] = useState([]);
    const [expandedCourses, setExpandedCourses] = useState([]);
    
    const [weekdayHours, setWeekdayHours] = useState(2);
    const [weekendHours, setWeekendHours] = useState(4);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (isOpen) {
            api.get('/courses')
                .then(res => {
                    const fetchedCourses = res.data.courses || [];
                    setCourses(fetchedCourses);
                    setFetching(false);
                    
                    if (courseId) {
                        setSelectedCourseIds([courseId]);
                        setExpandedCourses([courseId]);
                        const targetCourse = fetchedCourses.find(c => c._id === courseId);
                        if (targetCourse) {
                            setSelectedSectionIds(targetCourse.sections.map(s => s._id));
                        }
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch courses", err);
                    setFetching(false);
                });
        }
    }, [isOpen, courseId]);

    const toggleCourse = (id) => {
        setExpandedCourses(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleCourseSelection = (course) => {
        const isSelected = selectedCourseIds.includes(course._id);
        if (isSelected) {
            setSelectedCourseIds(selectedCourseIds.filter(id => id !== course._id));
            setSelectedSectionIds(selectedSectionIds.filter(id => !course.sections.map(s => s._id).includes(id)));
        } else {
            setSelectedCourseIds([...selectedCourseIds, course._id]);
            setSelectedSectionIds([...selectedSectionIds, ...course.sections.map(s => s._id)]);
        }
    };

    const toggleSectionSelection = (sectionId, parentCourseId) => {
        const isSelected = selectedSectionIds.includes(sectionId);
        if (isSelected) {
            setSelectedSectionIds(selectedSectionIds.filter(id => id !== sectionId));
        } else {
            setSelectedSectionIds([...selectedSectionIds, sectionId]);
            if (!selectedCourseIds.includes(parentCourseId)) {
                setSelectedCourseIds([...selectedCourseIds, parentCourseId]);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                playlistIds: selectedCourseIds,
                sectionIds: selectedSectionIds,
                weekdayHours: parseFloat(weekdayHours),
                weekendHours: parseFloat(weekendHours),
                startDate,
                courseId: courseId
            };
            const roadmap = await generateRoadmap(config);
            if (onGenerated) onGenerated(roadmap);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to generate roadmap.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">Mastery Roadmap</h2>
                            <p className="text-xs text-text-muted">Set your study capacity and conquer</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Content Selection */}
                    <div>
                        <label className="text-sm font-bold text-text-primary mb-3 block">Course Playlists</label>
                        <div className="space-y-2">
                            {fetching ? (
                                <div className="text-sm text-text-muted animate-pulse">Fetching library...</div>
                            ) : courses.length > 0 ? (
                                courses.filter(c => !courseId || c._id === courseId).map(course => (
                                    <div key={course._id} className="border border-border rounded-xl overflow-hidden bg-surface-2/40">
                                        <div className="flex items-center p-3 gap-3 hover:bg-surface-2 transition-colors">
                                            <button 
                                                type="button"
                                                onClick={() => toggleCourseSelection(course)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedCourseIds.includes(course._id) ? 'bg-primary border-primary' : 'border-border bg-surface'}`}
                                            >
                                                {selectedCourseIds.includes(course._id) && <Check className="w-3 h-3 text-white" />}
                                            </button>
                                            
                                            <div className="flex-1 cursor-pointer" onClick={() => toggleCourse(course._id)}>
                                                <p className="text-sm font-bold text-text-primary">{course.title}</p>
                                                <p className="text-[10px] text-text-muted uppercase tracking-widest">{course.sections?.length || 0} Playlists</p>
                                            </div>

                                            <button type="button" onClick={() => toggleCourse(course._id)} className="p-1 hover:bg-surface-3 rounded">
                                                {expandedCourses.includes(course._id) ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                                            </button>
                                        </div>

                                        {expandedCourses.includes(course._id) && (
                                            <div className="bg-black/20 border-t border-border/50 p-2 space-y-1">
                                                {course.sections?.map(section => (
                                                    <div 
                                                        key={section._id} 
                                                        onClick={() => toggleSectionSelection(section._id, course._id)}
                                                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${selectedSectionIds.includes(section._id) ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedSectionIds.includes(section._id) ? 'bg-primary border-primary' : 'border-border'}`}>
                                                            {selectedSectionIds.includes(section._id) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-xs font-medium text-text-secondary truncate">{section.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 border border-dashed border-border rounded-2xl text-center">
                                    <BookOpen className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-20" />
                                    <p className="text-sm text-text-muted">Library empty. Enroll in a course first.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Schedule Config */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Weekday Hours</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input 
                                    type="number" min="0.5" step="0.5" max="24"
                                    value={weekdayHours}
                                    onChange={e => setWeekdayHours(e.target.value)}
                                    className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:border-primary outline-none transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Weekend Hours</label>
                            <div className="relative">
                                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                <input 
                                    type="number" min="0.5" step="0.5" max="24"
                                    value={weekendHours}
                                    onChange={e => setWeekendHours(e.target.value)}
                                    className="w-full bg-primary/5 border border-primary/20 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:border-primary outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                            Our algorithm will prioritize larger missions for your weekend blocks to maximize your learning momentum.
                        </p>
                    </div>
                </form>

                <div className="p-6 border-t border-border bg-surface-2 flex gap-3">
                    <button onClick={onClose} type="button" className="flex-1 px-4 py-4 rounded-xl border border-border text-xs font-black uppercase tracking-widest text-text-primary hover:bg-surface-3 transition-all">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || selectedSectionIds.length === 0}
                        className="flex-[2] px-4 py-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                GENERATE ADAPTIVE PLAN
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateRoadmapModal;
