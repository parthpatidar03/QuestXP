import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

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
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Create New Course</h2>
            {error && <div className="bg-red-500/10 text-red-500 border border-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Course Title</label>
                    <input 
                        type="text" value={title} onChange={e => setTitle(e.target.value)} required
                        className="w-full p-2.5 bg-gray-900 rounded border border-gray-600 focus:border-yellow-400 outline-none text-white"
                        placeholder="e.g. Master React JS"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-300">Playlist Sections</label>
                        <button type="button" onClick={addSection} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors">
                            + Add Section
                        </button>
                    </div>

                    {sections.map((section, index) => (
                        <div key={index} className="p-4 bg-gray-900 rounded border border-gray-700 relative group">
                            {sections.length > 1 && (
                                <button type="button" onClick={() => removeSection(index)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
                                    &times;
                                </button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Section Title</label>
                                    <input 
                                        type="text" value={section.title} onChange={e => updateSection(index, 'title', e.target.value)} required
                                        className="w-full p-2 bg-gray-800 rounded border border-gray-600 focus:border-yellow-400 outline-none text-sm text-white"
                                        placeholder="e.g. Basics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">YouTube Playlist URL</label>
                                    <input 
                                        type="url" value={section.playlistUrl} onChange={e => updateSection(index, 'playlistUrl', e.target.value)} required
                                        className="w-full p-2 bg-gray-800 rounded border border-gray-600 focus:border-yellow-400 outline-none text-sm text-white"
                                        placeholder="https://youtube.com/playlist?list=..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Creating...' : 'Create Course'}
                </button>
            </form>
        </div>
    );
};

export default CourseCreationForm;
