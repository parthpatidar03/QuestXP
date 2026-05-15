import React, { useState, useEffect } from 'react';
import { Play, Edit2, Check, X, AlertCircle, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import LockedFeature from '../LockedFeature';
import AILoadingState from './AILoadingState';

const LEVEL_NOTES_EDIT = 3;

/**
 * Renders the AI structured summary for a lecture
 * @param {string} lectureId 
 * @param {string} courseId
 * @param {function} onSeek - (seconds) => void (to seek video playback)
 * @param {string} notesStatus - 'pending' | 'in_progress' | 'complete' | 'failed'
 */
const NotesTab = ({ lectureId, courseId, onSeek, notesStatus, errorReason, aiStatus = {} }) => {
    const { user } = useAuthStore();
    const [triggered, setTriggered] = useState(false);
    const [notes, setNotes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);

    const [isTriggering, setIsTriggering] = useState(false);
    const [simulatedProgress, setSimulatedProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Analyzing Lecture');

    const transcriptionStatus = aiStatus.transcription || 'pending';
    const isInProgress = notesStatus === 'in_progress' || transcriptionStatus === 'in_progress' || isTriggering;

    const fetchNotes = async () => {
        if (notesStatus !== 'complete') return;
        try {
            setLoading(true);
            const { data } = await api.get(`/lectures/${lectureId}/notes`);
            setNotes(data.notes);
        } catch (err) {
            if (err.response?.status === 429) {
                setError('Summary limit reached. Please wait an hour.');
            } else if (err.response?.status === 403) {
                setError('Level too low to access summary.');
            } else {
                setError('Failed to load summary.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        setTriggered(true);
        fetchNotes();
    };

    const handleManualStart = async () => {
        try {
            setIsTriggering(true);
            setError(null);
            await api.post(`/lectures/${lectureId}/summary/generate`);
        } catch (err) {
            const msg = err.response?.status === 429 
                ? err.response.data.message 
                : 'Failed to start summary generation.';
            setError(msg);
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
                    
                    if (notesStatus === 'in_progress') {
                        if (next > 80) setStatusMessage('Finalizing Summary');
                        else setStatusMessage('Extracting Key Points');
                    } else if (transcriptionStatus === 'in_progress') {
                        if (next > 50) setStatusMessage('Processing Audio');
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
        } else if (notesStatus === 'complete') {
            setSimulatedProgress(100);
            setStatusMessage('Summary Ready!');
        } else {
            setSimulatedProgress(0);
            setIsTriggering(false);
        }
        return () => clearInterval(interval);
    }, [isInProgress, notesStatus, transcriptionStatus, isTriggering]);

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;
        try {
            setSaving(true);
            const { data } = await api.patch(`/lectures/${lectureId}/notes/edit`, {
                content: editContent
            });
            // Backend returns { message, notes }. Trust the updated notes
            // document and let it become the new local state.
            if (data?.notes) {
                setNotes(data.notes);
            }
            setEditContent('');
            setIsEditing(false);
        } catch (err) {
            setError('Failed to save note.');
        } finally {
            setSaving(false);
        }
    };

    // Reset when lecture changes
    useEffect(() => {
        setTriggered(false);
        setNotes(null);
        setError(null);
        setLoading(false);
        setIsTriggering(false);
    }, [lectureId]);

    if (notesStatus === 'failed') {
        return (
            <div className="p-6 text-center text-text-muted">
                <AlertCircle className="w-8 h-8 text-danger mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Summary Generation Failed</h3>
                <p className="text-sm mb-6">{errorReason || 'An error occurred while generating summary.'}</p>
                <button 
                    onClick={handleManualStart}
                    className="btn-esports text-sm"
                >
                    Retry Generation ⚡
                </button>
            </div>
        );
    }

    if (isInProgress) {
        return (
            <AILoadingState 
                progress={simulatedProgress}
                status={statusMessage}
                title="AI Smart Summary"
                icon={<Bot className="w-10 h-10 text-[#00b4ff]" />}
            />
        );
    }

    // Trigger card
    if (!triggered) {
        const isReady = notesStatus === 'complete';
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
                {!isReady && (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,180,255,0.10)', border: '1px solid rgba(0,180,255,0.3)' }}>
                        <Bot className="w-6 h-6 text-[#00b4ff]" />
                    </div>
                )}
                
                {isReady && (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,180,255,0.10)', border: '1px solid rgba(0,180,255,0.3)' }}>
                        <Play className="w-6 h-6 text-[#00b4ff]" />
                    </div>
                )}

                <p className="text-base font-bold text-white mb-2">⚡ AI Smart Summary</p>
                <p className="text-sm mb-6" style={{ color: '#8b9cc8' }}>
                    {isReady 
                        ? 'AI has generated a structured summary for this lesson.' 
                        : 'Summary not ready yet — watch more of the lecture first.'}
                </p>

                {isReady && (
                    <button onClick={handleGenerate} className="btn-esports text-sm">
                        View Summary
                    </button>
                )}

                {!isReady && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold" style={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.3)', color: '#00b4ff' }}>
                            <span className="w-2 h-2 rounded-full bg-[#00b4ff] animate-pulse" />
                            Ready to Generate
                        </div>
                        <button 
                            onClick={handleManualStart}
                            className="text-[10px] uppercase tracking-tighter font-bold text-text-muted hover:text-[var(--color-primary)] transition-colors underline underline-offset-4"
                        >
                            Generate Summary ⚡
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-8 h-8 rounded-full border-2 border-[#2a2f52] border-t-[#00b4ff] animate-spin mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#4a5480' }}>Loading Notes…</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-6 text-danger text-center">{error}</div>;
    }

    if (!notes) return null;

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            
            {/* Summary Layer */}
            <section className="bg-surface-2 p-6 rounded-2xl border border-border relative overflow-hidden">
                {notes.transcriptSource === 'metadata_fallback' && (
                    <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                        <p className="text-[11px] font-bold text-danger uppercase tracking-wider">
                            Low Quality Warning: Video captions were unavailable. Summary is based on video title only.
                        </p>
                    </div>
                )}
                <h2 className="text-xl font-display font-bold text-white mb-3">Summary</h2>
                <p className="text-text-secondary leading-relaxed">{notes.summary}</p>
            </section>

            {/* High Priority Alerts */}
            {notes.highPriority && notes.highPriority.length > 0 && (
                <section className="bg-warning/10 border border-warning/20 p-5 rounded-2xl">
                    <h3 className="text-lg font-bold text-warning flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5" /> 
                        Key Takeaways / Exam Focus
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-warning/90 font-medium">
                        {notes.highPriority.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                </section>
            )}

            {/* Definitions with Clickable Timestamps */}
            {notes.definitions && notes.definitions.length > 0 && (
                <section>
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-border pb-2">Definitions</h3>
                    <div className="space-y-4">
                        {notes.definitions.map((def, i) => (
                            <div key={i} className="bg-surface-2 p-4 rounded-xl border border-border group hover:border-primary/30 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-primary mb-1">{def.term}</h4>
                                        <p className="text-sm text-text-secondary leading-relaxed">{def.definition}</p>
                                    </div>
                                    <button 
                                        onClick={() => onSeek(def.timestamp)}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-primary/20 hover:text-primary text-xs font-semibold text-text-muted transition-all"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        {formatTime(def.timestamp)}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Code Snippets */}
            {notes.codeSnippets && notes.codeSnippets.length > 0 && (
                <section>
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-border pb-2">Code Snippets</h3>
                    <div className="space-y-6">
                        {notes.codeSnippets.map((snippet, i) => (
                            <div key={i} className="rounded-xl overflow-hidden border border-border">
                                <div className="bg-surface-3 px-4 py-2 flex justify-between items-center text-xs font-mono text-text-muted border-b border-border">
                                    <span className="uppercase">{snippet.language}</span>
                                    <button 
                                        onClick={() => onSeek(snippet.timestamp)}
                                        className="hover:text-primary transition-colors flex items-center gap-1"
                                    >
                                        <Play className="w-3 h-3" /> {formatTime(snippet.timestamp)}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black overflow-x-auto text-sm text-text-primary">
                                    <code>{snippet.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Formulas */}
            {notes.formulas && notes.formulas.length > 0 && (
                <section>
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-border pb-2">Formulas & Equations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notes.formulas.map((formula, i) => (
                            <div key={i} className="bg-surface-2 p-4 rounded-xl border border-border flex flex-col justify-between">
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2">{formula.label}</h4>
                                    <div className="font-mono text-primary text-lg mb-4">{formula.content}</div>
                                </div>
                                <button 
                                    onClick={() => onSeek(formula.timestamp)}
                                    className="self-start flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-3 hover:bg-primary/20 hover:text-primary text-xs font-semibold text-text-muted transition-colors"
                                >
                                    <Play className="w-3 h-3" /> {formatTime(formula.timestamp)}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* User Community Edits (Level 3 Gated) */}
            <section className="pt-8 border-t border-border mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Community Summary</h3>
                    {!isEditing && user.level >= LEVEL_NOTES_EDIT && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-sm font-semibold transition-colors border border-border"
                        >
                            <Edit2 className="w-4 h-4" /> Add Note
                        </button>
                    )}
                </div>

                {isEditing && (
                    <div className="bg-surface-2 p-4 rounded-xl border border-primary/50 mb-6">
                        <textarea 
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            placeholder="Add your own notes, clarifications, or helpful links..."
                            className="w-full bg-black border border-border rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-primary resize-y min-h-[100px] mb-3"
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 rounded-lg text-text-muted hover:text-white text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={saving || !editContent.trim()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : <Check className="w-4 h-4" />}
                                Save Note
                            </button>
                        </div>
                    </div>
                )}

                {user.level < LEVEL_NOTES_EDIT && (
                    <LockedFeature 
                        featureName="Community Notes Editing"
                        requiredLevel={LEVEL_NOTES_EDIT}
                        currentLevel={user.level}
                        description="Reach Level 3 to contribute your own notes and clarifications to the community."
                    />
                )}

                {notes.userEdits && notes.userEdits.length > 0 ? (
                    <div className="space-y-4 mt-6">
                        {notes.userEdits.map((edit, i) => (
                            <div key={i} className="bg-surface-2/50 p-4 rounded-xl border border-border/50">
                                <p className="text-sm text-text-secondary leading-relaxed mb-3">{edit.content}</p>
                                <div className="text-xs font-mono text-text-muted">
                                    Added • {new Date(edit.editedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-muted text-center py-8">No community notes added yet.</p>
                )}
            </section>
        </div>
    );
};

// Helper function to format seconds into mm:ss
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default NotesTab;
