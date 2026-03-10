import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight, CheckCircle, Circle, Calendar, Download } from 'lucide-react';
import api from '../services/api';
import NavBar from '../components/NavBar';
import { format, parseISO } from 'date-fns';
import html2pdf from 'html2pdf.js';

const Roadmap = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [progress, setProgress] = useState(null);
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [courseRes, progressRes, planRes] = await Promise.all([
                    api.get(`/courses/${courseId}`),
                    api.get(`/progress/${courseId}`),
                    api.get(`/progress/${courseId}/plan`).catch(() => ({ data: { plan: null } }))
                ]);
                
                setCourse(courseRes.data.course);
                setProgress(progressRes.data.progress);
                setPlan(planRes.data.plan);
                
                // Expand the first incomplete section by default
                if (courseRes.data.course?.sections) {
                    const initialExpanded = {};
                    courseRes.data.course.sections.forEach((s, idx) => {
                        initialExpanded[s._id] = idx === 0;
                    });
                    setExpandedSections(initialExpanded);
                }
            } catch (err) {
                console.error("Failed to load roadmap data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    if (loading) return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!course) return <div className="min-h-screen bg-bg text-white p-10">Course not found.</div>;

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const isLectureCompleted = (lectureId) => {
        if (!progress || !progress.lectureProgress) return false;
        const prog = progress.lectureProgress.find(p => p.lecture === lectureId);
        return prog?.completed || false;
    };

    const getPhaseDates = (sectionTitle) => {
        if (!plan || !plan.phases) return null;
        const phase = plan.phases.find(p => p.sectionTitle === sectionTitle);
        if (!phase) return null;
        
        try {
            const start = format(new Date(phase.startDate), 'dd MMM');
            const end = format(new Date(phase.endDate), 'dd MMM');
            if (start === end) return start;
            return `${start} - ${end}`;
        } catch {
            return null;
        }
    };

    const handleDownloadPdf = () => {
        const element = document.getElementById('roadmap-container');
        if (!element) return;
        
        // Expand all sections before printing so content isn't hidden
        const allExpanded = {};
        course.sections.forEach(s => {
            allExpanded[s._id] = true;
        });
        setExpandedSections(allExpanded);
        
        // Small delay to allow React to render expanded sections
        setTimeout(() => {
            const opt = {
                margin:       0.5,
                filename:     `Course-${courseId}-Roadmap.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0d0f1a' },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save();
        }, 300);
    };

    return (
        <div className="min-h-screen bg-bg text-text-primary font-sans selection:bg-primary/30">
            <NavBar />
            
            <main id="roadmap-container" className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link to={`/courses/${courseId}`} className="p-2 bg-surface border border-border rounded-xl text-text-secondary hover:text-white hover:border-primary/50 transition-colors" data-html2canvas-ignore>
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-display font-bold text-white tracking-tight">{course.title} Roadmap</h1>
                            {plan ? (
                                <p className="text-sm text-text-muted mt-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> 
                                    Target Completion: <span className="font-semibold text-primary">{format(new Date(plan.deadline), 'MMM dd, yyyy')}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-warning mt-1">No AI Plan generated yet. Go back and create one!</p>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleDownloadPdf}
                        data-html2canvas-ignore
                        className="btn-glass self-start sm:self-center text-sm py-2 px-4 flex items-center gap-2"
                        title="Download Roadmap as PDF"
                    >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                    </button>
                </div>

                {/* Accordion List */}
                <div className="space-y-3">
                    {course.sections.map((section, idx) => {
                        const completedCount = section.lectures.filter(l => isLectureCompleted(l._id)).length;
                        const total = section.lectures.length;
                        const isExpanded = !!expandedSections[section._id];
                        const dateRange = getPhaseDates(section.title);

                        return (
                            <div key={section._id} className="bg-surface border border-border rounded-xl overflow-hidden transition-all duration-300">
                                {/* Section Header */}
                                <button 
                                    onClick={() => toggleSection(section._id)}
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-2 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Progress indicator */}
                                        <div className="hidden sm:flex flex-col items-center justify-center p-2 bg-bg rounded-lg shrink-0 w-16 h-16 border border-border">
                                            <span className="text-primary font-bold text-lg leading-none">{completedCount}</span>
                                            <span className="text-xs text-text-muted mt-1">of {total}</span>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1 tracking-tight">{section.title}</h3>
                                            
                                            {/* Subtitle / Dates */}
                                            <div className="flex items-center gap-4 text-xs font-semibold">
                                                <span className={`${completedCount === total ? 'text-success' : 'text-text-muted'}`}>
                                                    {Math.round((completedCount/total)*100)}% Complete
                                                </span>
                                                {dateRange && (
                                                    <span className="flex items-center gap-1.5 text-secondary border border-secondary/20 bg-secondary/10 px-2 py-0.5 rounded-full">
                                                        <Calendar className="w-3 h-3" />
                                                        {dateRange}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-2 text-text-muted shrink-0">
                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>
                                </button>

                                {/* Section Content (Lectures) */}
                                {isExpanded && (
                                    <div className="border-t border-border bg-bg/50 px-5 py-3">
                                        <div className="space-y-1">
                                            {section.lectures.map((lecture) => {
                                                const isDone = isLectureCompleted(lecture._id);
                                                return (
                                                    <Link 
                                                        to={`/courses/${courseId}/lectures/${lecture._id}`} 
                                                        key={lecture._id}
                                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors group"
                                                    >
                                                        {isDone ? (
                                                            <CheckCircle className="w-5 h-5 text-success shrink-0" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-border group-hover:text-text-muted transition-colors shrink-0" />
                                                        )}
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className={`text-sm font-medium truncate ${isDone ? 'text-text-muted line-through' : 'text-text-secondary group-hover:text-white transition-colors'}`}>
                                                                {lecture.title}
                                                            </p>
                                                            <p className="text-xs text-text-muted mt-0.5">
                                                                {Math.round(lecture.durationSeconds / 60)} min
                                                            </p>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default Roadmap;
