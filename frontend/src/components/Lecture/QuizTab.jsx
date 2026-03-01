import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Trophy, RotateCcw, Award } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import LockedFeature from '../LockedFeature';

const LEVEL_QUIZ = 3;

const QuizTab = ({ lectureId, quizStatus, errorReason }) => {
    const { user } = useAuthStore();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [answers, setAnswers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        if (quizStatus !== 'complete') {
            setLoading(false);
            return;
        }

        const fetchQuiz = async () => {
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

        fetchQuiz();
    }, [lectureId, quizStatus]);

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

    if (quizStatus === 'failed') {
        return (
            <div className="p-8 text-center text-text-muted">
                <XCircle className="w-8 h-8 text-danger mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Quiz Generation Failed</h3>
                <p className="text-sm">{errorReason || 'Lecture too short to generate a quiz.'}</p>
            </div>
        );
    }

    if (quizStatus === 'pending' || quizStatus === 'in_progress' || loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-text-muted">
                <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin mb-4"></div>
                <p className="font-semibold uppercase tracking-wider text-xs">
                    {quizStatus === 'in_progress' ? 'AI is crafting your quiz...' : 'Loading...'}
                </p>
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
                            <h4 className="text-white font-semibold mb-4 text-lg">Question 1</h4>
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
                            <span className="text-3xl font-display font-bold text-white relative z-10">{result.score}%</span>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {result.score >= 80 ? 'Excellent work!' : result.score >= 60 ? 'Good job!' : 'Keep practicing!'}
                        </h2>
                        <p className="text-text-secondary mb-6">
                            You got {result.correctCount} out of {result.totalCount} questions right. 
                        </p>
                        
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={handleRetake}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-3 hover:bg-surface border border-border text-white font-semibold transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Retake Quiz
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-border pb-2">Review Answers</h3>
                        {result.evaluatedQuestions.map((q, qIndex) => (
                            <div key={qIndex} className={`p-6 rounded-xl border ${q.isCorrect ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="mt-1">
                                        {q.isCorrect ? <CheckCircle2 className="w-6 h-6 text-success" /> : <XCircle className="w-6 h-6 text-danger" />}
                                    </div>
                                    <h4 className="text-lg font-medium text-white">{qIndex + 1}. {q.question}</h4>
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
                        <h2 className="text-xl font-display font-bold text-white">Practice Quiz</h2>
                        <div className="bg-surface-2 px-3 py-1 rounded text-xs font-semibold text-text-muted">
                            {answers.filter(a => a !== null).length} / {quiz.questionCount} Answered
                        </div>
                    </div>

                    {quiz.questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-surface-2 p-6 rounded-2xl border border-border">
                            <h4 className="text-lg font-medium text-white mb-5 leading-relaxed">
                                <span className="text-primary mr-2">{qIndex + 1}.</span> {q.question}
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
                                                    ? 'bg-primary/10 border-primary text-white scale-[1.01]' 
                                                    : 'bg-surface border-border text-text-secondary hover:border-text-muted hover:bg-surface-3'
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
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                isAllAnswered && !submitting
                                    ? 'bg-primary hover:bg-primary-hover hover:scale-105 cursor-pointer shadow-primary/30'
                                    : 'bg-surface-3 text-text-muted cursor-not-allowed border border-border'
                            }`}
                        >
                            {submitting ? (
                                <><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"/> Grading...</>
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
