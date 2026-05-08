import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';
import api from '../../services/api';
import { generateRoadmap } from '../../services/roadmapApi';

const GenerateRoadmapModal = ({ isOpen, onClose, onGenerated }) => {
    const [playlists, setPlaylists] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [dailyHours, setDailyHours] = useState(2);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [targetDate, setTargetDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (isOpen) {
            api.get('/courses/user/enrolled')
                .then(res => {
                    setPlaylists(res.data.courses || []);
                    setFetching(false);
                })
                .catch(err => {
                    console.error("Failed to fetch playlists", err);
                    setFetching(false);
                });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                playlistIds: selectedIds,
                dailyHours,
                startDate,
                excludedDays: [0] // Sunday rest by default
            };
            const roadmap = await generateRoadmap(config);
            onGenerated(roadmap);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to generate roadmap. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">Plan Your Journey</h2>
                            <p className="text-xs text-text-muted">Create a personalized study roadmap</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Playlist Selection */}
                    <div>
                        <label className="text-sm font-bold text-text-primary mb-3 block">Select Content to Include</label>
                        <div className="grid grid-cols-1 gap-2">
                            {fetching ? (
                                <div className="text-sm text-text-muted">Loading courses...</div>
                            ) : playlists.length > 0 ? (
                                playlists.map(pl => (
                                    <label key={pl._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedIds.includes(pl._id) ? 'bg-primary/5 border-primary' : 'bg-surface-2 border-border hover:border-text-muted'}`}>
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            checked={selectedIds.includes(pl._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds([...selectedIds, pl._id]);
                                                else setSelectedIds(selectedIds.filter(id => id !== pl._id));
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-primary truncate">{pl.title}</p>
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider">{pl.totalLectures} Lectures</p>
                                        </div>
                                    </label>
                                ))
                            ) : (
                                <div className="p-4 rounded-xl border border-dashed border-border text-center">
                                    <p className="text-sm text-text-muted">No courses found. Enroll in some first!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-text-primary mb-2 block">Study Hours / Day</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input 
                                    type="number" 
                                    min="0.5" 
                                    step="0.5"
                                    max="12"
                                    value={dailyHours}
                                    onChange={e => setDailyHours(e.target.value)}
                                    className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-text-primary mb-2 block">Target Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input 
                                    type="date" 
                                    value={targetDate}
                                    onChange={e => setTargetDate(e.target.value)}
                                    className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Our algorithm will distribute your study load as evenly as possible across {selectedIds.length} playlists to hit your target date.
                        </p>
                    </div>
                </form>

                <div className="p-6 border-t border-border bg-surface-2 flex gap-3">
                    <button onClick={onClose} type="button" className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-bold text-text-primary hover:bg-surface-3 transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || selectedIds.length === 0}
                        className="flex-[2] px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Start Your Journey
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateRoadmapModal;
