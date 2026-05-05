import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Bell, Search, BookOpenCheck, Moon, Sun, MessageSquare, X, Send } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import { getGamificationProfile } from '../services/gamificationApi';
import api from '../services/api';

const NavBar = () => {
    const { user } = useAuthStore();
    const { totalXP, level, setProfile } = useGamificationStore();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackState, setFeedbackState] = useState({ loading: false, error: '', success: '' });

    useEffect(() => {
        getGamificationProfile()
            .then(data => setProfile(data))
            .catch(() => {});
    }, [setProfile]);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const openFeedback = () => {
        setFeedbackState({ loading: false, error: '', success: '' });
        setIsFeedbackOpen(true);
    };

    const closeFeedback = () => {
        if (feedbackState.loading) return;
        setIsFeedbackOpen(false);
        setFeedbackMessage('');
        setFeedbackState({ loading: false, error: '', success: '' });
    };

    const submitFeedback = async (event) => {
        event.preventDefault();

        const trimmed = feedbackMessage.trim();
        if (trimmed.length < 10) {
            setFeedbackState({ loading: false, error: 'Please write at least 10 characters.', success: '' });
            return;
        }

        try {
            setFeedbackState({ loading: true, error: '', success: '' });
            await api.post('/feedback', {
                message: trimmed,
                contextPage: window.location.pathname,
            });
            setFeedbackState({ loading: false, error: '', success: 'Thanks. Feedback sent successfully.' });
            setFeedbackMessage('');
        } catch (error) {
            const message = error?.response?.data?.error || 'Failed to send feedback. Please try again.';
            setFeedbackState({ loading: false, error: message, success: '' });
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex items-center h-16 gap-4">

                <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-4">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                        <BookOpenCheck className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-text-primary">
                        QuestXP
                    </span>
                </Link>

                <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-muted hover:border-text-muted transition-colors">
                    <Search className="w-4 h-4 shrink-0" />
                    <span>Search courses…</span>
                </div>

                <div className="flex-1" />

                <nav className="hidden md:flex items-center gap-1 mr-2">
                    <Link to="/" className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        Home
                    </Link>
                    <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        My Courses
                    </Link>
                </nav>

                <div className="flex items-center gap-2">
                    <button
                        onClick={openFeedback}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
                        title="Send feedback"
                        aria-label="Send feedback"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>

                    <button 
                        onClick={toggleTheme}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
                        title="Toggle theme"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <button className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface" />
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
                    <Zap className="w-4 h-4 text-gold" />
                    <span className="text-sm font-semibold text-text-primary">{(totalXP || user?.totalXP || 0).toLocaleString()} XP</span>
                </div>

                <Link to="/profile" className="relative flex items-center gap-2 group">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full border border-border p-0.5 bg-surface">
                            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xs">
                                {user?.name?.charAt(0)?.toUpperCase() ?? 'Q'}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gold text-text-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-surface">
                            {level || user?.level || 1}
                        </div>
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate max-w-[100px]">
                        {user?.name?.split(' ')[0] ?? 'Player'}
                    </span>
                </Link>

            </div>

            {isFeedbackOpen && (
                <div className="fixed inset-0 z-[60] bg-bg/70 backdrop-blur-sm flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Send feedback">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">Share Feedback</h2>
                                <p className="text-sm text-text-muted mt-1">Your feedback helps us improve QuestXP during development.</p>
                            </div>
                            <button
                                onClick={closeFeedback}
                                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                                aria-label="Close feedback dialog"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form className="mt-4" onSubmit={submitFeedback}>
                            <label htmlFor="feedback-message" className="text-sm font-medium text-text-secondary">Feedback</label>
                            <textarea
                                id="feedback-message"
                                value={feedbackMessage}
                                onChange={(e) => setFeedbackMessage(e.target.value)}
                                placeholder="Tell us what is working, what is confusing, or what you want next..."
                                className="mt-2 w-full min-h-32 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                                maxLength={2000}
                                disabled={feedbackState.loading}
                            />
                            <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                                <span>Minimum 10 characters</span>
                                <span>{feedbackMessage.length}/2000</span>
                            </div>

                            {feedbackState.error && (
                                <p className="mt-3 text-sm text-danger">{feedbackState.error}</p>
                            )}
                            {feedbackState.success && (
                                <p className="mt-3 text-sm text-success">{feedbackState.success}</p>
                            )}

                            <div className="mt-5 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeFeedback}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                                    disabled={feedbackState.loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                    disabled={feedbackState.loading}
                                >
                                    <Send className="w-4 h-4" />
                                    {feedbackState.loading ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
};

export default NavBar;
