import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Clock, Globe, User, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import NavBar from '../components/NavBar';
import { BGPattern } from '../components/ui/bg-pattern';

const AdminFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/feedback');
            setFeedbacks(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch feedback. Are you an admin?');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg text-text-primary relative overflow-hidden">
            <BGPattern variant="grid" mask="fade-edges" fill="var(--color-primary)" className="opacity-5" />
            <NavBar />

            <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
                <Link 
                    to="/dashboard" 
                    className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors mb-6"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">User Feedback</h1>
                        <p className="text-text-muted mt-1">Review what users are saying about QuestXP.</p>
                    </div>
                    <div className="px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                        <span className="text-primary font-bold text-sm">{feedbacks.length} Total</span>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-danger text-sm mb-6">
                        {error}
                    </div>
                )}

                {feedbacks.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
                        <MessageSquare className="w-12 h-12 text-text-muted mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold">No feedback yet</h3>
                        <p className="text-sm text-text-muted max-w-xs">When users submit feedback through the modal, it will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {feedbacks.map((fb) => (
                            <div key={fb._id} className="glass-card p-6 border-l-4 border-l-primary/40 hover:border-l-primary transition-all">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-text-primary font-semibold">
                                            <User className="w-4 h-4 text-text-muted" />
                                            {fb.userName || 'Anonymous'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-text-muted">
                                            <Mail className="w-4 h-4" />
                                            {fb.userEmail || 'No email provided'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-wider text-text-muted">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-2 rounded-md border border-border">
                                            <Clock className="w-3 h-3" />
                                            {new Date(fb.createdAt).toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-2 rounded-md border border-border">
                                            <Globe className="w-3 h-3" />
                                            {fb.contextPage || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-surface-2 border border-border text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                    {fb.message}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFeedback;
