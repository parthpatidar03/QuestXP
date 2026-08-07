import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, BookOpen, AlertCircle, Sparkles, ChevronDown, ChevronRight, Check, Zap, Info } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import { generateRoadmap } from '../../services/roadmapApi';

const GenerateRoadmapModal = ({ isOpen, onClose, onGenerated, courseId = null }) => {
    const [courses, setCourses] = useState([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [selectedSectionIds, setSelectedSectionIds] = useState([]);
    const [selectedLectureIds, setSelectedLectureIds] = useState([]);
    const [expandedCourses, setExpandedCourses] = useState([]);
    const [expandedSections, setExpandedSections] = useState([]);
    
    const [weekdayHours, setWeekdayHours] = useState(2);
    const [weekendHours, setWeekendHours] = useState(4);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [countdown, setCountdown] = useState(10);
    const [pollCount, setPollCount] = useState(0);
    const [stuckError, setStuckError] = useState(false);
    const MAX_POLLS = 18; // ~3 minutes of polling
    const dateInputRef = React.useRef(null);

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
                            // Select all lectures by default when a course is focused
                            const allLecIds = targetCourse.sections.flatMap(s => s.lectures.map(l => l._id));
                            setSelectedLectureIds(allLecIds);
                        }
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch courses", err);
                    setFetching(false);
                });
        }
    }, [isOpen, courseId]);

    const isProcessing = courses
        .filter(c => selectedCourseIds.includes(c._id))
        .some(c => c.status === 'processing');

    useEffect(() => {
        let timer;
        if (isOpen && isProcessing && countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isOpen, isProcessing, countdown]);

    // Re-fetch courses if processing to see if they're done
    useEffect(() => {
        if (isOpen && isProcessing && countdown === 0) {
            if (pollCount >= MAX_POLLS) {
                setStuckError(true);
                return;
            }
            api.get('/courses').then(res => {
                setCourses(res.data.courses || []);
                setPollCount(prev => prev + 1);
                setCountdown(10);
            });
        }
    }, [isOpen, isProcessing, countdown, pollCount]);

    const toggleCourse = (id) => {
        setExpandedCourses(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSection = (id) => {
        setExpandedSections(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleCourseSelection = (course) => {
        const isSelected = selectedCourseIds.includes(course._id);
        const sectionIds = course.sections.map(s => s._id);
        const lectureIds = course.sections.flatMap(s => s.lectures.map(l => l._id));

        if (isSelected) {
            setSelectedCourseIds(selectedCourseIds.filter(id => id !== course._id));
            setSelectedSectionIds(selectedSectionIds.filter(id => !sectionIds.includes(id)));
            setSelectedLectureIds(selectedLectureIds.filter(id => !lectureIds.includes(id)));
        } else {
            setSelectedCourseIds([...selectedCourseIds, course._id]);
            setSelectedSectionIds([...new Set([...selectedSectionIds, ...sectionIds])]);
            setSelectedLectureIds([...new Set([...selectedLectureIds, ...lectureIds])]);
        }
    };

    const toggleSectionSelection = (section, parentCourseId) => {
        const isSelected = selectedSectionIds.includes(section._id);
        const lectureIds = section.lectures.map(l => l._id);

        if (isSelected) {
            setSelectedSectionIds(selectedSectionIds.filter(id => id !== section._id));
            setSelectedLectureIds(selectedLectureIds.filter(id => !lectureIds.includes(id)));
        } else {
            setSelectedSectionIds([...selectedSectionIds, section._id]);
            setSelectedLectureIds([...new Set([...selectedLectureIds, ...lectureIds])]);
            if (!selectedCourseIds.includes(parentCourseId)) {
                setSelectedCourseIds([...selectedCourseIds, parentCourseId]);
            }
        }
    };

    const toggleLectureSelection = (lectureId, sectionId, parentCourseId) => {
        const isSelected = selectedLectureIds.includes(lectureId);
        if (isSelected) {
            setSelectedLectureIds(selectedLectureIds.filter(id => id !== lectureId));
            // Note: We keep the section and course selected even if one lecture is deselected
            // The backend logic handles "if lectureIds is provided, use them"
        } else {
            setSelectedLectureIds([...selectedLectureIds, lectureId]);
            if (!selectedSectionIds.includes(sectionId)) {
                setSelectedSectionIds([...selectedSectionIds, sectionId]);
            }
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
                lectureIds: selectedLectureIds,
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
            const msg = err.response?.data?.msg || "Failed to generate roadmap.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-bg/80 backdrop-blur-xl" onClick={onClose} />
            
            <div className="relative w-full max-w-xl clay rounded-clay-lg overflow-hidden flex flex-col max-h-[90vh] z-10">
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-clay bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">Mastery Roadmap</h2>
                            <p className="text-xs text-text-muted">Set your study capacity and conquer</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-clay-sm transition-colors">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                <div className="relative flex-1 flex flex-col min-h-0">
                    {(isProcessing || stuckError) && (
                        <div className="absolute inset-0 z-50 bg-bg/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                            {stuckError ? (
                                <>
                                    <div className="w-20 h-20 mb-6 rounded-full bg-danger/10 border-2 border-red-500/30 flex items-center justify-center">
                                        <X className="w-8 h-8 text-danger" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">Processing Timed Out</h3>
                                    <p className="text-sm text-text-secondary max-w-xs mb-6">
                                        The course is taking longer than expected. This can happen with very large playlists. Try closing and reopening this modal.
                                    </p>
                                    <div className="flex gap-3">
                                        <button onClick={onClose} className="px-6 py-2.5 rounded-clay-sm clay-sm text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors">
                                            Close
                                        </button>
                                        <button onClick={() => { setStuckError(false); setPollCount(0); setCountdown(10); }} className="px-6 py-2.5 rounded-clay-sm bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors">
                                            Retry
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 mb-6 relative">
                                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-primary">
                                            {countdown}s
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">Surgical Workers Active</h3>
                                    <p className="text-sm text-text-secondary max-w-xs mb-2">
                                        Our AI workers are currently deep-fetching the curriculum data. 
                                        Roadmap generation will be available in a few seconds.
                                    </p>
                                    <p className="text-[10px] text-text-muted mb-6">Attempt {pollCount + 1}/{MAX_POLLS}</p>
                                    <div className="flex gap-4">
                                        <button onClick={onClose} className="px-6 py-2 rounded-clay-sm clay-sm text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* How it works briefing */}
                    <div className="p-4 clay-sunk rounded-clay-lg space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <div className="p-1 rounded bg-primary/10">
                                <Info className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">How it works</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Set your daily limits. Our surgical engine slices your curriculum to fit. 
                            <strong> Missed a day?</strong> Click <span className="text-primary font-bold">+</span> on your roadmap. 
                            <strong> Finished early?</strong> Click <span className="text-primary font-bold">-</span>. 
                            The entire future plan shifts instantly to keep your goals realistic.
                        </p>
                    </div>

                    {/* Content Selection */}
                    <div>
                        <label className="text-sm font-bold text-text-primary mb-3 block">Course Playlists</label>
                        <div className="space-y-2">
                            {fetching ? (
                                <div className="text-sm text-text-muted animate-pulse">Fetching library...</div>
                            ) : courses.length > 0 ? (
                                courses.filter(c => !courseId || c._id === courseId).map(course => (
                                    <div key={course._id} className="clay-sm rounded-clay overflow-hidden bg-surface-2/40">
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
                                            <div className="clay-sunk p-2 space-y-1 rounded-clay mt-1">
                                                {course.sections?.map(section => (
                                                    <div key={section._id} className="space-y-1">
                                                        <div 
                                                            className={`flex items-center gap-2 p-2 rounded-clay-sm transition-all ${selectedSectionIds.includes(section._id) ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                                                        >
                                                            <button 
                                                                type="button"
                                                                onClick={() => toggleSectionSelection(section, course._id)}
                                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedSectionIds.includes(section._id) ? 'bg-primary border-primary' : 'border-border bg-surface'}`}
                                                            >
                                                                {selectedSectionIds.includes(section._id) && <Check className="w-2.5 h-2.5 text-white" />}
                                                            </button>
                                                            
                                                            <div className="flex-1 cursor-pointer flex items-center gap-2" onClick={() => toggleSection(section._id)}>
                                                                <span className="text-xs font-medium text-text-secondary truncate">{section.title}</span>
                                                                <span className="text-[10px] text-text-muted">({section.lectures?.length || 0})</span>
                                                            </div>

                                                            <button type="button" onClick={() => toggleSection(section._id)} className="p-1 hover:bg-surface-3 rounded">
                                                                {expandedSections.includes(section._id) ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
                                                            </button>
                                                        </div>

                                                        {expandedSections.includes(section._id) && (
                                                            <div className="pl-7 pr-2 py-1 space-y-1">
                                                                {section.lectures?.map(lecture => (
                                                                    <div 
                                                                        key={lecture._id}
                                                                        onClick={() => toggleLectureSelection(lecture._id, section._id, course._id)}
                                                                        className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-all ${selectedLectureIds.includes(lecture._id) ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                                                                    >
                                                                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${selectedLectureIds.includes(lecture._id) ? 'bg-primary border-primary' : 'border-border'}`}>
                                                                            {selectedLectureIds.includes(lecture._id) && <Check className="w-2 h-2 text-white" />}
                                                                        </div>
                                                                        <span className="text-[11px] truncate">{lecture.title}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 border border-border rounded-clay-lg text-center">
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
                                    className="w-full clay-sunk rounded-clay pl-10 pr-4 py-3 text-sm font-bold text-text-primary focus:border-primary outline-none transition-colors"
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
                                    className="w-full bg-surface-2 border border-primary/40 rounded-clay pl-10 pr-4 py-3 text-sm font-bold text-text-primary focus:border-primary outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Start Date</label>
                        <div className="relative group cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-hover:text-primary transition-colors z-10" />
                            <input 
                                ref={dateInputRef}
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full clay-sunk rounded-clay pl-10 pr-4 py-3 text-sm font-bold text-text-primary focus:border-primary outline-none transition-colors [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-clay-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Our algorithm will prioritize larger missions for your weekend blocks to maximize your learning momentum.
                        </p>
                    </div>
                </form>
                </div>

                <div className="p-6 border-t border-border bg-surface-2 flex gap-3">
                    <button onClick={onClose} type="button" className="flex-1 px-4 py-4 rounded-clay clay-sm text-xs font-black uppercase tracking-widest text-text-primary hover:bg-surface-3 transition-all">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || selectedLectureIds.length === 0}
                        className="flex-[2] px-4 py-4 rounded-clay bg-primary text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-primary/20 flex items-center justify-center gap-2"
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
        </div>,
        document.body
    );
};

export default GenerateRoadmapModal;
