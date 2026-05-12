import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, X, BookOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

/**
 * CourseSearch component handles searching courses with debounced API fetching
 * and a results dropdown with keyboard navigation.
 */
function CourseSearch() {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const [fetchedCourses, setFetchedCourses] = useState(null); // null = not yet fetched
    const [isFetching, setIsFetching] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    // Use cache if available, otherwise use API-fetched list
    const cachedCourses = queryClient.getQueryData(['courses']);
    const allCourses = cachedCourses || fetchedCourses || [];

    // Fetch all courses from API when cache is cold and user starts typing
    const ensureCoursesLoaded = useCallback(async () => {
        if (cachedCourses || fetchedCourses || isFetching) return;
        setIsFetching(true);
        try {
            const { data } = await api.get('/courses');
            const courses = data.courses || [];
            setFetchedCourses(courses);
            // Also populate the query cache so Dashboard benefits too
            queryClient.setQueryData(['courses'], courses);
        } catch (error) {
            setFetchedCourses([]);
        } finally {
            setIsFetching(false);
        }
    }, [cachedCourses, fetchedCourses, isFetching, queryClient]);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setOpen(true);
        // Debounce the fetch trigger so we don't fire immediately on every keystroke
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (val.trim()) ensureCoursesLoaded();
        }, 300);
    };

    const results = query.trim().length === 0
        ? []
        : allCourses.filter(c =>
            c.title?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6);

    const showDropdown = open && focused && query.trim().length > 0;

    const handleSelect = useCallback((course) => {
        setQuery('');
        setOpen(false);
        navigate(`/courses/${course._id}`);
    }, [navigate]);

    const handleKeyDown = (e) => {
        if (!showDropdown) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted(h => Math.min(h + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted(h => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[highlighted]) handleSelect(results[highlighted]);
        } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
        }
    };

    // Reset highlight when results change
    useEffect(() => { setHighlighted(0); }, [results.length]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => () => clearTimeout(debounceRef.current), []);

    return (
        <div id="tour-search" ref={containerRef} className="relative flex-1 max-w-md">
            <div className={`flex items-center gap-2 bg-surface-2 border rounded-lg px-3 h-10 text-sm transition-colors ${focused ? 'border-primary' : 'border-border hover:border-text-muted'}`}>
                {isFetching
                    ? <Loader2 className="w-4 h-4 shrink-0 text-primary animate-spin" />
                    : <Search className="w-4 h-4 shrink-0 text-text-muted" />
                }
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => { setFocused(true); setOpen(true); if (query.trim()) ensureCoursesLoaded(); }}
                    onBlur={() => setFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search courses…"
                    className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-muted min-w-0"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Search courses"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                />
                {query && (
                    <button
                        onMouseDown={e => { e.preventDefault(); setQuery(''); setOpen(false); }}
                        className="text-text-muted hover:text-text-primary transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
                    {isFetching ? (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted">
                            <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
                            Loading courses…
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted">
                            <BookOpen className="w-4 h-4 shrink-0" />
                            No courses match "{query}"
                        </div>
                    ) : (
                        <ul role="listbox">
                            {results.map((course, i) => {
                                const thumb = course?.thumbnailUrl || course?.sections?.[0]?.lectures?.[0]?.thumbnailUrl;
                                return (
                                    <li
                                        key={course._id}
                                        role="option"
                                        aria-selected={i === highlighted}
                                        onMouseDown={e => { e.preventDefault(); handleSelect(course); }}
                                        onMouseEnter={() => setHighlighted(i)}
                                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${i === highlighted ? 'bg-surface-2' : 'hover:bg-surface-2'}`}
                                    >
                                        <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-border bg-surface-2 flex items-center justify-center">
                                            {thumb
                                                ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                                                : <BookOpen className="w-4 h-4 text-text-muted" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-text-primary truncate">{course.title}</p>
                                            <p className="text-xs text-text-muted">{course.totalLectures || 0} lectures</p>
                                        </div>
                                        <Search className="w-3 h-3 text-text-muted shrink-0" />
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default CourseSearch;
