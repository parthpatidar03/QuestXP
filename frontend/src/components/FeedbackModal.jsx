import React, { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';

const FeedbackModal = ({ open, onClose, contextPage = 'unknown' }) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

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
        }
    }, [open]);

    if (!open) return null;

    const close = () => {
        setMessage('');
        setError('');
        onClose();
    };

    const submit = (event) => {
        event.preventDefault();

        const trimmed = message.trim();
        if (trimmed.length < 10) {
            setError('Please write at least 10 characters.');
            return;
        }

        // Open Gmail with pre-filled recipient, subject, and body
        const recipientEmail = 'u1892911@gmail.com';
        const subject = 'QuestXP Feedback';
        const body = `${trimmed}\n\n--- Sent from ${contextPage} page`;

        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;

        // Close modal after a brief delay
        setTimeout(close, 500);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-bg/70 backdrop-blur-sm flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Send feedback">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">Share Feedback</h2>
                        <p className="text-sm text-text-muted mt-1">Your feedback helps us improve QuestXP during development.</p>
                    </div>
                    <button
                        onClick={close}
                        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                        aria-label="Close feedback dialog"
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
                        className="mt-2 w-full min-h-32 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                        maxLength={2000}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                        <span>Minimum 10 characters</span>
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
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors inline-flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send Feedback
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
