import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight, CheckCircle, Circle, Calendar, Download, AlertCircle } from 'lucide-react';
import api from '../services/api';
import NavBar from '../components/NavBar';
import { BGPattern } from '../components/ui/bg-pattern';
import { format, parseISO } from 'date-fns';
import html2pdf from 'html2pdf.js';

const Roadmap = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [progress, setProgress] = useState(null);
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfExporting, setPdfExporting] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                const [courseRes, progressRes, planRes] = await Promise.all([
                    api.get(`/courses/${courseId}`),
                    api.get(`/progress/${courseId}`),
                    api.get(`/progress/${courseId}/plan`).catch(err => {
                        console.warn("Failed to load study plan:", err.message);
                        return { data: { plan: null } };
                    })
                ]);
                
                if (!courseRes.data.course) {
                    throw new Error("Course data is invalid");
                }
                
                setCourse(courseRes.data.course);
                setProgress(progressRes.data.progress || { lectureProgress: [] });
                setPlan(planRes.data.plan);
                
                // Expand the first incomplete section by default
                if (courseRes.data.course?.sections?.length > 0) {
                    const initialExpanded = {};
                    courseRes.data.course.sections.forEach((s, idx) => {
                        initialExpanded[s._id] = idx === 0;
                    });
                    setExpandedSections(initialExpanded);
                }
            } catch (err) {
                console.error("Failed to load roadmap data", err);
                setError(err.message || "Failed to load course roadmap. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    if (loading) return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <NavBar />
            <div className="max-w-4xl w-full mx-auto px-4 py-8">
                {/* Skeleton Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-surface-2 rounded-xl w-10 h-10 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-6 bg-surface-2 rounded w-48 animate-pulse" />
                            <div className="h-4 bg-surface-2 rounded w-64 animate-pulse" />
                        </div>
                    </div>
                    <div className="h-10 bg-surface-2 rounded-lg w-32 animate-pulse" />
                </div>
                {/* Skeleton Sections */}
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-surface border border-border rounded-xl p-5">
                            <div className="h-6 bg-surface-2 rounded w-3/4 animate-pulse" />
                            <div className="h-4 bg-surface-2 rounded w-1/2 animate-pulse mt-3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <NavBar />
            <div className="max-w-4xl w-full mx-auto px-4 py-8">
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 flex gap-4">
                    <AlertCircle className="w-6 h-6 text-danger shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h2 className="font-semibold text-danger mb-1">Failed to load roadmap</h2>
                        <p className="text-sm text-text-secondary mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

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

    const handleDownloadPdf = async () => {
        try {
            setPdfError(null);
            setPdfExporting(true);
            const element = document.getElementById('roadmap-container');
            if (!element) {
                throw new Error("Roadmap content not found");
            }
            
            // Expand all sections before printing so content isn't hidden
            const allExpanded = {};
            course.sections.forEach(s => {
                allExpanded[s._id] = true;
            });
            setExpandedSections(allExpanded);
            
            // Wait for React to render expanded sections
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const opt = {
                margin:       0.5,
                filename:     `Course-${courseId}-Roadmap.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0d0f1a' },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            setPdfExporting(false);
        } catch (err) {
            console.error("PDF export failed:", err);
            setPdfError("Failed to generate PDF. Please try again.");
            setPdfExporting(false);
            // Auto-clear error after 5 seconds
            setTimeout(() => setPdfError(null), 5000);
        }
    };

    return (
        <div className="min-h-screen bg-bg text-text-primary font-sans relative overflow-hidden">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-10 z-0" />
            <NavBar />
            
            <main id="roadmap-container" className="max-w-3xl mx-auto px-4 py-12">
                {/* Error Toast */}
                {pdfError && (
                    <div className="mb-6 bg-danger/10 border border-danger/30 rounded-lg p-3 flex items-center gap-2 text-sm text-danger">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {pdfError}
                    </div>
                )}
                
                {/* Clean Header */}
                <div className="mb-12">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-text-primary">{course.title}</h1>
                        <Link 
                            to={`/courses/${courseId}`} 
                            className="p-2 text-text-secondary hover:text-primary transition-colors" 
                            data-html2canvas-ignore
                            aria-label="Back to course"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    </div>
                    
                    {/* Plan info or optional CTA */}
                    {plan ? (
                        <p className="text-sm text-text-muted">
                            Target completion: <span className="text-primary font-medium">{format(new Date(plan.deadline), 'MMM dd, yyyy')}</span>
                        </p>
                    ) : (
                        <p className="text-sm text-text-muted">
                            <Link 
                                to={`/courses/${courseId}`} 
                                className="text-primary hover:underline transition-colors"
                            >
                                Create a study plan
                            </Link>
                            {' '}to get personalized milestones and goals
                        </p>
                    )}
                </div>

                {/* Minimal Accordion List */}
                <div className="space-y-2">
                    {course.sections.map((section, idx) => {
                        const completedCount = section.lectures.filter(l => isLectureCompleted(l._id)).length;
                        const total = section.lectures.length;
                        const isExpanded = !!expandedSections[section._id];

                        return (
                            <div key={section._id} className="border-b border-border last:border-b-0">
                                {/* Minimal Section Header */}
                                <button 
                                    onClick={() => toggleSection(section._id)}
                                    aria-expanded={isExpanded}
                                    aria-controls={`section-${section._id}`}
                                    className="w-full py-4 flex items-center justify-between text-left hover:bg-surface/30 transition-colors rounded-lg px-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-text-primary">{section.title}</h3>
                                        <p className="text-xs text-text-muted mt-1">
                                            {completedCount} of {total} • {Math.round((completedCount/total)*100)}% complete
                                        </p>
                                    </div>
                                    
                                    <div className="p-2 text-text-muted shrink-0 ml-2" aria-hidden="true">
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                </button>

                                {/* Clean Lecture List */}
                                {isExpanded && (
                                    <div id={`section-${section._id}`} role="region" aria-label={`Lectures in ${section.title}`} className="pl-6 pb-2">
                                        {section.lectures && section.lectures.length > 0 ? (
                                            <ul className="space-y-2">
                                                {section.lectures.map((lecture) => {
                                                    const isDone = isLectureCompleted(lecture._id);
                                                    const isTruncated = lecture.title && lecture.title.length > 50;
                                                    return (
                                                        <li key={lecture._id}>
                                                            <Link 
                                                                to={`/courses/${courseId}/lectures/${lecture._id}`} 
                                                                className={`flex items-center gap-3 py-2 px-2 rounded-lg transition-colors ${
                                                                    isDone 
                                                                        ? 'text-text-muted' 
                                                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                                                                }`}
                                                                title={isTruncated ? lecture.title : undefined}
                                                            >
                                                                {isDone ? (
                                                                    <CheckCircle className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                                                                ) : (
                                                                    <Circle className="w-4 h-4 text-border shrink-0" aria-hidden="true" />
                                                                )}
                                                                <span className={`text-sm flex-1 truncate ${isDone ? 'line-through' : ''}`}>
                                                                    {lecture.title}
                                                                </span>
                                                                <span className="text-xs text-text-muted shrink-0 ml-2">
                                                                    {lecture.durationSeconds ? `${Math.round(lecture.durationSeconds / 60)}m` : ''}
                                                                </span>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-text-muted py-2">No lectures in this section yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Subtle PDF Export (Tertiary Action) */}
                <div className="mt-12 pt-8 border-t border-border flex justify-center">
                    <button 
                        onClick={handleDownloadPdf}
                        disabled={pdfExporting}
                        data-html2canvas-ignore
                        className={`text-sm flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                            pdfExporting
                                ? 'text-text-muted cursor-not-allowed'
                                : 'text-text-secondary hover:text-primary'
                        }`}
                        title="Download Roadmap as PDF"
                        aria-busy={pdfExporting}
                    >
                        {pdfExporting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>Exporting...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Roadmap;
