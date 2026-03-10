import React, { useState } from 'react';
import { Calendar, Clock, X, Loader2, Sparkles, Target } from 'lucide-react';
import api from '../../services/api';

const PresetButton = ({ minutes, label, isSelected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            isSelected 
                ? 'bg-primary text-bg font-bold shadow-[0_0_10px_rgba(56,189,248,0.3)] border border-primary/50' 
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/30'
        }`}
    >
        {label || `${minutes}m`}
    </button>
);

const SetupPlanModal = ({ courseId, isOpen, onClose, onPlanGenerated }) => {
    // Tomorrow as minimum deadline
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    // Default to +30 days
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const defaultDateStr = defaultDate.toISOString().split('T')[0];

    const [deadline, setDeadline] = useState(defaultDateStr);
    const [weekdayMins, setWeekdayMins] = useState(60);
    const [weekendMins, setWeekendMins] = useState(120);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (weekdayMins === 0 && weekendMins === 0) {
            setError("You must study at least one day a week!");
            return;
        }

        setLoading(true);
        try {
            await api.post(`/progress/${courseId}/plan`, {
                deadline,
                weekdayCapacityMins: weekdayMins,
                weekendCapacityMins: weekendMins,
                restDays: [] // Optional
            });
            onPlanGenerated(); // Refresh dashboard/course UI
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to generate study plan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-md bg-surface p-0 overflow-hidden relative border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-border flex justify-between items-center bg-surface-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Target className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-display font-bold text-text-primary">Set Your Target</h2>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-6">
                    {error && (
                        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Deadline */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                            <Calendar className="w-4 h-4 text-text-muted" />
                            Target Completion Date
                        </label>
                        <input
                            type="date"
                            min={minDateStr}
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            required
                            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm"
                        />
                    </div>

                    {/* Weekday Capacity */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                            <Clock className="w-4 h-4 text-text-muted" />
                            Weekday Study Time <span className="text-xs font-normal text-text-muted">(Mon-Fri)</span>
                        </label>
                        <select
                            value={weekdayMins}
                            onChange={(e) => setWeekdayMins(Number(e.target.value))}
                            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b9cc8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                        >
                            <option value={0}>Off / No Study</option>
                            {[...Array(20)].map((_, i) => {
                                const mins = (i + 1) * 30; // 30m increments up to 10 hours
                                const hrs = Math.floor(mins / 60);
                                const rem = mins % 60;
                                const label = hrs > 0 
                                    ? `${hrs} hr${hrs > 1 ? 's' : ''}${rem > 0 ? ` ${rem} min` : ''}` 
                                    : `${rem} mins`;
                                return <option key={mins} value={mins}>{label}</option>;
                            })}
                        </select>
                    </div>

                    {/* Weekend Capacity */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                            <Clock className="w-4 h-4 text-text-muted" />
                            Weekend Study Time <span className="text-xs font-normal text-text-muted">(Sat-Sun)</span>
                        </label>
                        <select
                            value={weekendMins}
                            onChange={(e) => setWeekendMins(Number(e.target.value))}
                            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b9cc8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                        >
                            <option value={0}>Off / No Study</option>
                            {[...Array(20)].map((_, i) => {
                                const mins = (i + 1) * 30; // 30m increments up to 10 hours
                                const hrs = Math.floor(mins / 60);
                                const rem = mins % 60;
                                const label = hrs > 0 
                                    ? `${hrs} hr${hrs > 1 ? 's' : ''}${rem > 0 ? ` ${rem} min` : ''}` 
                                    : `${rem} mins`;
                                return <option key={mins} value={mins}>{label}</option>;
                            })}
                        </select>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-esports w-full flex items-center justify-center gap-2 py-3 mt-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate AI Plan
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-text-muted">
                        We'll analyze the course structure and build an adaptive daily schedule.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SetupPlanModal;
