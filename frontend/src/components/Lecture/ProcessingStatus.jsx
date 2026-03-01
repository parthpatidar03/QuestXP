import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../../services/api';

const STATUS_ICONS = {
    complete: <CheckCircle2 className="w-5 h-5 text-success" />,
    failed: <XCircle className="w-5 h-5 text-danger" />,
    in_progress: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
    pending: <Clock className="w-5 h-5 text-text-muted" />
};

const LABELS = {
    transcription: 'Transcription',
    notes: 'Structured Notes',
    quiz: 'Practice Quiz',
    topics: 'Topic Chapters'
};

const ProcessingStatus = ({ courseId, lectureId, initialStatus }) => {
    const [status, setStatus] = useState(initialStatus || {
        transcription: 'pending', notes: 'pending', quiz: 'pending', topics: 'pending'
    });
    const [errorReason, setErrorReason] = useState(null);
    const [courseProgress, setCourseProgress] = useState(null);

    // Poll for lecture status
    useEffect(() => {
        let interval;
        
        const checkStatus = async () => {
            try {
                // We're anticipating T032 implementation here
                const { data } = await api.get(`/lectures/${lectureId}/ai-status`);
                setStatus(data.aiStatus);
                setErrorReason(data.aiStatus.errorReason);

                const isAnyInProgress = Object.values({
                    t: data.aiStatus.transcription,
                    n: data.aiStatus.notes,
                    q: data.aiStatus.quiz,
                    to: data.aiStatus.topics
                }).includes('in_progress');

                if (!isAnyInProgress && !Object.values(data.aiStatus).includes('pending')) {
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('Failed to fetch AI status', err);
            }
        };

        // If any are pending or in_progress, start polling
        const isProcessing = Object.values(status).some(s => s === 'pending' || s === 'in_progress');
        
        if (isProcessing) {
            checkStatus(); // immediate check
            interval = setInterval(checkStatus, 3000);
        }

        return () => clearInterval(interval);
    }, [lectureId]);

    // Anticipating T033: Course level progress
    useEffect(() => {
        let interval;
        const checkProgress = async () => {
            try {
                const { data } = await api.get(`/courses/${courseId}/progress`);
                setCourseProgress(data);
                
                if (data.percentage >= 100) clearInterval(interval);
            } catch (err) {
                // Ignore errors if endpoint not ready yet
            }
        };

        checkProgress();
        interval = setInterval(checkProgress, 5000);
        
        return () => clearInterval(interval);
    }, [courseId]);

    return (
        <div className="bg-surface-2 border border-border rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">AI Processing Status</h3>
            
            {courseProgress && (
                <div className="mb-5 pb-5 border-b border-border">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-text-secondary">Course Analytics Generation</span>
                        <span className="text-primary">{Math.round(courseProgress.percentage)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${courseProgress.percentage}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-3">
                        {STATUS_ICONS[status[key] || 'pending']}
                        <span className="text-sm text-text-secondary font-medium">{label}</span>
                    </div>
                ))}
            </div>

            {errorReason && (
                <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger flex items-start gap-2">
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{errorReason}</p>
                </div>
            )}
        </div>
    );
};

export default ProcessingStatus;
