import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, X, Link as LinkIcon, AlertCircle, Info } from 'lucide-react';
import { shootConfetti } from '../../utils/confetti';
import AiGenerateButton from '../ui/AiGenerateButton';

const CourseCreationForm = ({ onSuccess }) => {
    const [title, setTitle] = useState('');
    const [sections, setSections] = useState([{ title: '', playlistUrl: '', order: 0 }]);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    
    // Check if we are in demo/guest mode
    const isGuest = !localStorage.getItem('accessToken') && window.location.search.includes('demo=true');

    const addSection = () => {
        setSections([...sections, { title: '', playlistUrl: '', order: sections.length }]);
    };

    const updateSection = async (index, field, value) => {
        const newSections = [...sections];
        newSections[index][field] = value;
        setSections(newSections);

        // Auto-fill logic
        const isYoutubeUrl = value.includes('youtube.com') || value.includes('youtu.be');
        if (field === 'playlistUrl' && isYoutubeUrl) {
            try {
                const { data } = await api.get(`/courses/playlist-info?url=${encodeURIComponent(value)}`);
                if (data.title) {
                    const updatedSections = [...newSections];
                    // Only fill if section title is empty or default
                    if (!updatedSections[index].title) {
                        updatedSections[index].title = data.title;
                    }
                    setSections(updatedSections);

                    // Also fill course title if empty
                    if (!title) {
                        setTitle(data.title);
                    }
                }
            } catch (err) {
                console.error('[AutoFill] Failed:', err);
            }
        }
    };


    const removeSection = (index) => {
        if (sections.length > 1) {
            const newSections = sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }));
            setSections(newSections);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (isGuest) {
            // Simulate creation for guest
            setTimeout(() => {
                const mockCourse = {
                    _id: 'demo-' + Date.now(),
                    title: title || 'Demo Course',
                    status: 'ready',
                    totalLectures: sections.reduce((acc) => acc + 5, 0), // Mock 5 lectures per section
                    createdAt: new Date().toISOString(),
                    sections: sections.map((s, i) => ({
                        _id: 'sec-' + i,
                        title: s.title || `Section ${i + 1}`,
                        playlistUrl: s.playlistUrl,
                        order: i,
                        lectures: Array(5).fill(0).map((_, li) => ({
                            _id: `lec-${i}-${li}`,
                            title: `Lesson ${li + 1}: Getting Started`,
                            duration: 600,
                            thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
                            aiStatus: { transcription: 'complete', notes: 'complete', quiz: 'complete', topics: 'complete' }
                        }))
                    }))
                };
                localStorage.setItem('questxp_demo_course', JSON.stringify(mockCourse));
                setIsSubmitting(false);
                shootConfetti();
                if (onSuccess) onSuccess(mockCourse._id);
                else navigate(`/courses/${mockCourse._id}?demo=true`);
            }, 2000);
            return;
        }

        try {
            const { data } = await api.post('/courses', { title, sections });
            shootConfetti();
            if (onSuccess) {
                onSuccess(data.course._id);
            } else {
                navigate(`/courses/${data.course._id}`);
            }
        } catch (err) {
            setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to create course');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-text-primary">Create course</h2>
            
            {error && (
                <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-lg mb-6 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <label className="block text-sm font-semibold mb-2 text-text-secondary">Course name</label>
                    <input 
                        type="text" value={title} onChange={e => setTitle(e.target.value)} required
                        className="w-full p-3.5 bg-surface-2 rounded-lg border border-border focus:border-primary outline-none transition-colors text-text-primary placeholder:text-text-muted text-lg"
                        placeholder="e.g. Fullstack Web Development Mastery"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-text-secondary">Curriculum sections</label>
                    </div>

                    <div className="space-y-4">
                        {sections.map((section, index) => (
                            <div key={index} className="p-5 bg-surface-2 rounded-xl border border-border relative group">
                                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Section {index + 1}</h3>
                                    {sections.length > 1 && (
                                        <button type="button" onClick={() => removeSection(index)} className="text-text-muted hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold" title="Remove Section">
                                            <X className="w-4 h-4" />
                                            REMOVE
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted mb-1.5">Section title</label>
                                        <input 
                                            type="text" value={section.title} onChange={e => updateSection(index, 'title', e.target.value)} required
                                            className="w-full p-2.5 bg-surface border border-border focus:border-primary rounded-md outline-none text-sm text-text-primary placeholder:text-text-muted"
                                            placeholder="e.g. Module 1: The Basics"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted mb-1.5 flex items-center gap-1.5">
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            YouTube Playlist or Video URL
                                        </label>
                                        <input 
                                            type="url" value={section.playlistUrl} onChange={e => updateSection(index, 'playlistUrl', e.target.value)} required
                                            className="w-full p-2.5 bg-surface border border-border focus:border-primary rounded-md outline-none text-sm text-text-primary placeholder:text-text-muted"
                                            placeholder="https://youtube.com/playlist?list=... or https://youtu.be/..."
                                        />
                                        <div className="mt-2 p-2.5 bg-surface/50 rounded-lg border border-border/30 flex items-start gap-2 text-sm text-text-muted leading-relaxed">
                                            <div className="bg-primary/10 p-1 rounded">
                                                <Info className="w-3 h-3 text-primary shrink-0" />
                                            </div>
                                            <span>
                                                <strong className="text-primary uppercase tracking-tighter mr-1">One-Shot Support:</strong> 
                                                Paste a playlist or a single long video. 
                                                <span className="text-text-primary font-bold ml-1">AI will automatically split 1hr+ lectures into modular missions</span> using timestamps or topic shifts.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={addSection} className="w-full py-3 mt-2 border-2 border-dashed border-border rounded-xl text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add another section
                    </button>
                </div>

                <div className="pt-4 border-t border-border">
                    <AiGenerateButton isSubmitting={isSubmitting} />
                </div>
            </form>
        </div>
    );
};

export default CourseCreationForm;
