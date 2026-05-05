import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, XCircle, Trophy, RotateCcw, Award } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import LockedFeature from '../LockedFeature';

const LEVEL_QUIZ = 1;

const QuizTab = ({ lectureId, aiStatus = {}, autoStart = false }) => {
    const { user } = useAuthStore();
    const processingRequestRef = useRef(null);
    const [triggered, setTriggered] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isTriggering, setIsTriggering] = useState(false);
    
    const [answers, setAnswers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [startTime, setStartTime] = useState(null);
    
    const [simulatedProgress, setSimulatedProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Analyzing Lecture');

    const quizStatus = aiStatus.quiz || 'pending';
    const transcriptionStatus = aiStatus.transcription || 'pending';
    const errorReason = aiStatus.errorReason;
    const isInProgress = quizStatus === 'in_progress' || transcriptionStatus === 'in_progress' || isTriggering;

    const fetchQuiz = async () => {
        if (quizStatus !== 'complete') return;
        try {
            setLoading(true);
            const { data } = await api.get(`/lectures/${lectureId}/quiz`);
            setQuiz(data.quiz);
            setAnswers(new Array(data.quiz.questionCount).fill(null));
            setStartTime(Date.now());
        } catch (err) {
            if (err.response?.status === 403) {
                setError('Level too low to access quiz.');
            } else {
                setError('Failed to load quiz.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTrigger = () => {
        setTriggered(true);
        fetchQuiz();
    };

    const handleManualStart = async () => {
        try {
            setIsTriggering(true);
            await api.post(`/internal/lectures/${lectureId}/process`);
            // Status will be updated via polling in Player.jsx
        } catch (err) {
            setError('Failed to start quiz generation.');
            setIsTriggering(false);
        }
    };

    // Simulated progress effect
    useEffect(() => {
        let interval;
        if (isInProgress) {
            setSimulatedProgress(5);
            setStatusMessage(transcriptionStatus === 'in_progress' ? 'Transcribing Video' : 'Analyzing Lecture');
            
            interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    const next = prev + (Math.random() * 2 + 0.5);
                    
                    // Update messages based on progress
                    if (quizStatus === 'in_progress') {
                        if (next > 80) setStatusMessage('Finalizing Quiz');
                        else setStatusMessage('Crafting Questions');
                    } else if (transcriptionStatus === 'in_progress') {
                        if (next > 50) setStatusMessage('Extracting Topics');
                        else setStatusMessage('Transcribing Video');
                    } else if (isTriggering) {
                        setStatusMessage('Preparing AI...');
                    }
                    
                    if (next >= 98) {
                        clearInterval(interval);
                        return 98;
                    }
                    return next;
                });
            }, 800);
        } else if (quizStatus === 'complete') {
            setSimulatedProgress(100);
            setStatusMessage('Quiz Ready!');
        } else {
            setSimulatedProgress(0);
            setIsTriggering(false);
        }
        return () => clearInterval(interval);
    }, [isInProgress, quizStatus, transcriptionStatus]);

    // Reset when lecture changes
    useEffect(() => {
        setTriggered(false);
        setQuiz(null);
        setResult(null);
        setError(null);
        setLoading(false);
        setIsTriggering(false);

        // Auto-trigger if explicitly requested or video ended
        const params = new URLSearchParams(window.location.search);
        const shouldAutoStart = params.get('startQuiz') === 'true' || autoStart;
        if (shouldAutoStart && quizStatus === 'pending' && transcriptionStatus === 'pending' && processingRequestRef.current !== lectureId) {
            processingRequestRef.current = lectureId;
            api.post(`/internal/lectures/${lectureId}/process`).catch(() => {});
        }

        if (shouldAutoStart && quizStatus === 'complete') {
            // Small delay to show 100% progress
            const timer = setTimeout(() => {
                setTriggered(true);
                fetchQuiz();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [lectureId, quizStatus, transcriptionStatus, autoStart]);

    const handleOptionSelect = (questionIndex, optionIndex) => {
        if (result) return; // Prevent changing answers after submission
        const newAnswers = [...answers];
        newAnswers[questionIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (answers.includes(null)) return;
        
        try {
            setSubmitting(true);
            const timeTakenSecs = Math.floor((Date.now() - startTime) / 1000);
            
            const { data } = await api.post(`/lectures/${lectureId}/quiz/submit`, {
                answers,
                timeTakenSecs
            });
            
            setResult(data);

            // Celebration Logic
            if (data.progress?.success || data.progress?.alreadyCompleted) {
                const xp = data.progress?.xpAwarded || 50;
                // We'll use window dispatch to tell Player to show completion
                window.dispatchEvent(new CustomEvent('mission-completed', { 
                    detail: { xpEarned: xp } 
                }));
            }
        } catch (err) {
            console.error('Failed to submit quiz', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetake = () => {
        setResult(null);
        setAnswers(new Array(quiz.questionCount).fill(null));
        setStartTime(Date.now());
    };

    if (quizStatus === 'failed' || transcriptionStatus === 'failed') {
        return (
            <div className="p-8 text-center text-text-muted">
                <XCircle className="w-8 h-8 text-danger mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Quiz Generation Failed</h3>
                <p className="text-sm">{errorReason || 'Lecture too short to generate a quiz.'}</p>
            </div>
        );
    }

    // Trigger card
    if (!triggered) {
        const isReady = quizStatus === 'complete';

        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245,165,36,0.10)', border: '1px solid rgba(245,165,36,0.3)' }}>
                    <Trophy className="w-6 h-6 text-[#f5a524]" />
                </div>
                <p className="text-base font-bold text-text-primary mb-2">🎯 AI Practice Quiz</p>
                <p className="text-sm mb-6 text-text-secondary">
                    {isReady
                        ? 'Test your knowledge with AI-generated questions from this lesson.'
                        : isInProgress ? 'AI is crafting your quiz…' : 'Quiz not ready yet — watch more of the lecture first.'}
                </p>
                
                {isInProgress && (
                    <div className="w-full max-w-[260px] mb-6 animate-in fade-in zoom-in duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted animate-pulse">{statusMessage}</span>
                            <span className="text-[10px] font-bold text-[var(--color-primary)]">{Math.round(simulatedProgress)}%</span>
                        </div>
                        <div className="progress-bar h-2 shadow-inner">
                            <div 
                                className="progress-bar__fill shadow-[0_0_12px_var(--color-primary)]" 
                                style={{ width: `${simulatedProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {isReady && (
                    <button onClick={handleTrigger} className="btn-esports text-sm">
                        Start Quiz 🎮
                    </button>
                )}
                {!isReady && !isInProgress && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold" style={{ background: 'rgba(245,165,36,0.1)', border: '1px solid rgba(245,165,36,0.3)', color: '#f5a524' }}>
                            <span className="w-2 h-2 rounded-full bg-[#f5a524] animate-pulse" />
                            Coming soon
                        </div>
                        <button 
                            onClick={handleManualStart}
                            className="text-[10px] uppercase tracking-tighter font-bold text-text-muted hover:text-[var(--color-primary)] transition-colors underline underline-offset-4"
                        >
                            Or Generate Now ⚡
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-8 h-8 rounded-full border-2 border-[#2a2f52] border-t-[#f5a524] animate-spin mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#4a5480' }}>Loading Quiz…</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-6 text-danger text-center">{error}</div>;
    }

    if (!quiz) return null;

    if (user.level < LEVEL_QUIZ) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <LockedFeature 
                    featureName="AI Practice Quiz"
                    requiredLevel={LEVEL_QUIZ}
                    currentLevel={user.level}
                    locked={true}
                >
                    {/* Dummy content for blur preview */}
                    <div className="space-y-6">
                        <div className="bg-surface-2 p-6 rounded-xl">
                            <h4 className="text-text-primary font-semibold mb-4 text-lg">Question 1</h4>
                            <div className="space-y-3">
                                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-surface-3 rounded-lg border border-border"></div>)}
                            </div>
                        </div>
                    </div>
                </LockedFeature>
            </div>
        );
    }

    const isAllAnswered = !answers.includes(null);

    return (
        <div className="p-6 max-w-3xl mx-auto min-h-full">
            
            {result ? (
                // Results View
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-surface-2 p-8 rounded-2xl border border-border text-center relative overflow-hidden">
                        {/* Confetti or glows could go here */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-surface-3">
                            <div className="h-full bg-primary" style={{ width: `${result.score}%` }}></div>
                        </div>
                        
                        {result.isNewPersonalBest && (
                            <div className="absolute top-4 right-4 bg-warning/20 text-warning px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5" /> New Personal Best!
                            </div>
                        )}

                        <div className="w-24 h-24 rounded-full border-4 border-surface-3 flex items-center justify-center mx-auto mb-4 relative">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle cx="44" cy="44" r="44" fill="none" stroke="currentColor" className="text-surface-3" strokeWidth="8" />
                                <circle 
                                    cx="44" cy="44" r="44" fill="none" stroke="currentColor" className="text-primary" strokeWidth="8"
                                    strokeDasharray={`${(result.score / 100) * 276} 276`}
                                />
                            </svg>
                            <span className="text-3xl font-display font-bold text-text-primary relative z-10">{result.score}%</span>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-text-primary mb-2">
                            {result.score >= 80 ? 'Excellent work!' : result.score >= 60 ? 'Good job!' : 'Keep practicing!'}
                        </h2>
                        <p className="text-text-secondary mb-6">
                            You got {result.correctCount} out of {result.totalCount} questions right. 
                        </p>
                        
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={handleRetake}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-3 hover:bg-surface border border-border text-text-primary font-semibold transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Retake Quiz
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-text-primary mb-4 border-b border-border pb-2">Review Answers</h3>
                        {result.evaluatedQuestions.map((q, qIndex) => (
                            <div key={qIndex} className={`p-6 rounded-xl border ${q.isCorrect ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="mt-1">
                                        {q.isCorrect ? <CheckCircle2 className="w-6 h-6 text-success" /> : <XCircle className="w-6 h-6 text-danger" />}
                                    </div>
                                    <h4 className="text-lg font-medium text-text-primary">{qIndex + 1}. {q.question}</h4>
                                </div>
                                
                                <div className="space-y-2 ml-10">
                                    {q.options.map((opt, oIndex) => {
                                        let optionClass = "p-3 rounded-lg border text-sm ";
                                        if (oIndex === q.correctIndex) {
                                            optionClass += "bg-success/10 border-success/30 text-success font-medium";
                                        } else if (oIndex === q.userAnswer && !q.isCorrect) {
                                            optionClass += "bg-danger/10 border-danger/30 text-danger font-medium";
                                        } else {
                                            optionClass += "bg-surface text-text-secondary border-border opacity-50";
                                        }

                                        return (
                                            <div key={oIndex} className={optionClass}>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="ml-10 mt-4 p-4 bg-surface-2 rounded-lg border border-border/50 text-sm">
                                    <div className="font-semibold text-text-primary mb-1">Explanation:</div>
                                    <div className="text-text-secondary">{q.explanation}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Quiz Taking View
                <div className="space-y-8 pb-20">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-display font-bold text-text-primary">Practice Quiz</h2>
                        <div className="bg-surface-2 px-3 py-1 rounded text-xs font-semibold text-text-muted">
                            {answers.filter(a => a !== null).length} / {quiz.questionCount} Answered
                        </div>
                    </div>

                    {quiz.questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-surface-2 p-6 rounded-2xl border border-border">
                            <h4 className="text-lg font-medium text-primary mb-5 leading-relaxed">
                                <span className="mr-2">{qIndex + 1}.</span> {q.question}
                            </h4>
                            <div className="space-y-3">
                                {q.options.map((opt, oIndex) => {
                                    const isSelected = answers[qIndex] === oIndex;
                                    return (
                                        <button
                                            key={oIndex}
                                            onClick={() => handleOptionSelect(qIndex, oIndex)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                                                isSelected 
                                                    ? 'bg-primary/10 border-primary text-text-primary scale-[1.01]' 
                                                    : 'bg-surface border-border text-text-secondary hover:border-text-muted hover:bg-surface-3 hover:text-text-primary'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected ? 'border-primary' : 'border-text-muted'
                                            }`}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                            </div>
                                            <span className="text-sm font-medium">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="sticky bottom-4 mx-auto w-full max-w-sm mt-8">
                        <button
                            onClick={handleSubmit}
                            disabled={!isAllAnswered || submitting}
                            className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                                isAllAnswered && !submitting
                                    ? 'bg-primary hover:bg-primary-hover hover:scale-105 cursor-pointer shadow-primary/30 text-[oklch(0.16_0.025_155)]'
                                    : 'bg-surface-3 text-text-muted cursor-not-allowed border border-border'
                            }`}
                        >
                            {submitting ? (
                                <><div className="w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin"/> Grading...</>
                            ) : (
                                'Submit Quiz & Earn XP'
                            )}
                        </button>
                        {!isAllAnswered && (
                            <p className="text-center text-xs text-text-muted mt-2 font-medium">
                                Answer all {quiz.questionCount} questions to submit
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizTab;
