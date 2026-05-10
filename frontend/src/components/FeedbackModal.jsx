import React, { useEffect, useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const FeedbackModal = ({ open: openProp, isOpen, onClose, contextPage = 'unknown' }) => {
    const open = openProp ?? isOpen ?? false;
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setError('');
            setSuccess(false);
            setLoading(false);
        }
    }, [open]);

    if (!open) return null;

    const close = () => {
        setMessage('');
        setError('');
        setSuccess(false);
        onClose();
    };

    const submit = async (event) => {
        event.preventDefault();

        const trimmed = message.trim();
        if (trimmed.length < 5) {
            setError('Please write at least 5 characters.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/feedback', {
                message: trimmed,
                contextPage
            });
            setSuccess(true);
            setMessage('');
            setTimeout(close, 2000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to send feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] bg-bg/70 backdrop-blur-sm flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
            <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
                {success ? (
                    <div className="py-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">Feedback Received!</h2>
                        <p className="text-text-muted mt-2">Thank you for helping us improve QuestXP.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">Share Feedback</h2>
                                <p className="text-sm text-text-muted mt-1">Your feedback helps us improve QuestXP during development.</p>
                            </div>
                            <button
                                onClick={close}
                                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                                aria-label="Close feedback dialog"
                                disabled={loading}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form className="mt-4" onSubmit={submit}>
                            <label htmlFor="feedback-message" className="text-sm font-medium text-text-secondary">Feedback</label>
                            <textarea
                                id="feedback-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us what is working, what is confusing, or what you want next..."
                                className="mt-2 w-full min-h-32 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                maxLength={2000}
                                disabled={loading}
                            />
                            <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                                <span>Minimum 5 characters</span>
                                <span>{message.length}/2000</span>
                            </div>

                            {error && (
                                <p className="mt-3 text-sm text-danger">{error}</p>
                            )}

                            <div className="mt-5 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={close}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || message.trim().length < 5}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {loading ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
