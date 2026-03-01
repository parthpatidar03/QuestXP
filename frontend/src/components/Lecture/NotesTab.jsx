import React, { useState, useEffect } from 'react';
import { Play, Edit2, Check, X, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import LockedFeature from '../LockedFeature';

const LEVEL_NOTES_EDIT = 3;

/**
 * Renders the AI structured notes for a lecture
 * @param {string} lectureId 
 * @param {string} courseId
 * @param {function} onSeek - (seconds) => void (to seek video playback)
 * @param {string} notesStatus - 'pending' | 'in_progress' | 'complete' | 'failed'
 */
const NotesTab = ({ lectureId, courseId, onSeek, notesStatus, errorReason }) => {
    const { user } = useAuthStore();
    const [notes, setNotes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (notesStatus !== 'complete') {
            setLoading(false);
            return;
        }

        const fetchNotes = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/lectures/${lectureId}/notes`);
                setNotes(data.notes);
            } catch (err) {
                if (err.response?.status === 403) {
                    setError('Level too low to access notes.');
                } else {
                    setError('Failed to load notes.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, [lectureId, notesStatus]);

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;
        try {
            setSaving(true);
            const { data } = await api.patch(`/lectures/${lectureId}/notes/edit`, {
                content: editContent
            });
            setNotes(data.notes);
            setIsEditing(false);
            setEditContent('');
        } catch (err) {
            console.error('Failed to save edit', err);
            // Could add toast here
        } finally {
            setSaving(false);
        }
    };

    if (notesStatus === 'failed') {
        return (
            <div className="p-6 text-center text-text-muted">
                <AlertCircle className="w-8 h-8 text-danger mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Notes Generation Failed</h3>
                <p className="text-sm">{errorReason || 'An error occurred while generating notes.'}</p>
            </div>
        );
    }

    if (notesStatus === 'pending' || notesStatus === 'in_progress' || loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-text-muted">
                <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin mb-4"></div>
                <p className="font-semibold uppercase tracking-wider text-xs">
                    {notesStatus === 'in_progress' ? 'AI is generating notes...' : 'Loading...'}
                </p>
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
            <section className="bg-surface-2 p-6 rounded-2xl border border-border">
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
                    <h3 className="text-lg font-bold text-white">Community Notes</h3>
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
