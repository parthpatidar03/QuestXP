import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/useAuthStore';

const UsernameModal = ({ isOpen, onClose }) => {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, checkAuth } = useAuthStore();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const oldUser = { ...user };
        const newUsername = username;

        setError('');
        setIsLoading(true);

        // Optimistic Update
        useAuthStore.setState({ user: { ...user, username: newUsername, usernameSet: true } });
        onClose();

        try {
            await api.patch('/auth/username', { username: newUsername });
            // checkAuth() call removed to avoid redundant re-render if successful
        } catch (err) {
            // Revert on error
            useAuthStore.setState({ user: oldUser });
            setError(err.response?.data?.error || 'Failed to set username.');
            // Re-open modal if it was closed
            // Since this component is managed by parent visibility, 
            // we might need a toast instead or just let the user try again from Profile.
            alert(err.response?.data?.error || 'Failed to set username. Reverting...');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-md bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-8 sm:p-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    
                    <h2 className="text-2xl font-black mb-3 uppercase tracking-tight text-text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        Choose Your Identity
                    </h2>
                    <p className="text-text-secondary text-sm mb-8 font-medium">
                        Your username will be shown on the global leaderboard to protect your privacy. Choose something legendary.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                placeholder="legendary_learner"
                                minLength={3}
                                maxLength={20}
                                required
                                className="w-full px-5 py-4 rounded-2xl bg-surface-2 border border-border focus:border-primary outline-none text-text-primary font-bold placeholder:text-text-muted transition-all text-center tracking-wide"
                                autoComplete="off"
                            />
                            {username.length >= 3 && !error && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-success">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="text-xs font-bold text-danger bg-danger/10 py-2 px-3 rounded-lg border border-danger/20">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || username.length < 3}
                            className="w-full py-4 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim Username'}
                        </button>
                    </form>
                    
                    <p className="mt-6 text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60">
                        3-20 characters • Lowercase & numbers only
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default UsernameModal;
