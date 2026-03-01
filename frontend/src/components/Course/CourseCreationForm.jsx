import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, X, Link as LinkIcon, AlertCircle } from 'lucide-react';

const CourseCreationForm = () => {
    const [title, setTitle] = useState('');
    const [sections, setSections] = useState([{ title: '', playlistUrl: '', order: 0 }]);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const addSection = () => {
        setSections([...sections, { title: '', playlistUrl: '', order: sections.length }]);
    };

    const updateSection = (index, field, value) => {
        const newSections = [...sections];
        newSections[index][field] = value;
        setSections(newSections);
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
        try {
            const { data } = await api.post('/courses', { title, sections });
            navigate(`/courses/${data.course._id}`);
        } catch (err) {
            setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to create course');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card mb-8">
            <h2 className="text-2xl font-display font-bold mb-6 text-text-primary">Create Your Quest</h2>
            
            {error && (
                <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-lg mb-6 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <label className="block text-sm font-semibold mb-2 text-text-secondary uppercase tracking-wider">Course Name</label>
                    <input 
                        type="text" value={title} onChange={e => setTitle(e.target.value)} required
                        className="w-full p-3.5 bg-surface-2 rounded-lg border border-border focus:border-primary outline-none transition-colors text-text-primary placeholder:text-text-muted text-lg"
                        placeholder="e.g. Fullstack Web Development Mastery"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wider">Curriculum Sections</label>
                    </div>

                    <div className="space-y-4">
                        {sections.map((section, index) => (
                            <div key={index} className="p-5 bg-surface-2/50 rounded-xl border border-border relative group">
                                {sections.length > 1 && (
                                    <button type="button" onClick={() => removeSection(index)} className="absolute top-3 right-3 text-text-muted hover:text-danger hover:bg-danger/10 p-1 rounded-md transition-colors" title="Remove Section">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-8">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Section Title</label>
                                        <input 
                                            type="text" value={section.title} onChange={e => updateSection(index, 'title', e.target.value)} required
                                            className="w-full p-2.5 bg-surface border border-border focus:border-primary rounded-md outline-none text-sm text-text-primary placeholder:text-text-muted"
                                            placeholder="e.g. Module 1: The Basics"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            YouTube Playlist URL
                                        </label>
                                        <input 
                                            type="url" value={section.playlistUrl} onChange={e => updateSection(index, 'playlistUrl', e.target.value)} required
                                            className="w-full p-2.5 bg-surface border border-border focus:border-primary rounded-md outline-none text-sm text-text-primary placeholder:text-text-muted"
                                            placeholder="https://youtube.com/playlist?list=..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={addSection} className="w-full py-3 mt-2 border-2 border-dashed border-border rounded-xl text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Another Section
                    </button>
                </div>

                <div className="pt-4 border-t border-border">
                    <button 
                        type="submit" disabled={isSubmitting}
                        className="btn-primary w-full py-4 text-base relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <span className="relative z-10">{isSubmitting ? 'Summoning Content...' : 'Generate New Course'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseCreationForm;
