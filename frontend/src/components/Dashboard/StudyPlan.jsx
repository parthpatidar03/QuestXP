import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const StudyPlan = () => {
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const { data } = await api.get('/plan/today');
                setPlan(data.plan);
            } catch (err) {
                if (err.response?.status === 403) {
                    setError('Unlock the Study Plan feature at Level 3! Keep earning XP.');
                } else {
                    setError('Failed to load study plan.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    if (loading) return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md animate-pulse">
            <div className="h-6 bg-gray-700 w-1/3 rounded mb-4"></div>
            <div className="h-10 bg-gray-700 rounded mb-2"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
        </div>
    );

    if (error) return (
        <div className="bg-gray-800/50 p-6 rounded-xl border border-dashed border-gray-600 shadow-md flex items-center justify-center text-center h-full">
            <p className="text-gray-400">
                <span className="block text-2xl mb-2">🔒</span>
                {error}
            </p>
        </div>
    );

    if (!plan || !plan.courses || plan.courses.length === 0) return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md">
            <h2 className="text-xl font-bold mb-4 text-white">Today's Study Plan</h2>
            <p className="text-gray-400">Your schedule is clear! Create a new course to get started.</p>
        </div>
    );

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Today's Study Plan</h2>
                    <p className="text-sm text-gray-400 mt-1">{plan.totalPlannedMinutes} mins targeted today</p>
                </div>
                <div className="bg-gray-900 border border-gray-700 px-3 py-1 rounded text-sm text-yellow-400 font-mono font-bold">
                    Daily Goal
                </div>
            </div>

            <div className="space-y-3">
                {plan.courses.map((item, idx) => (
                    <Link 
                        key={idx}
                        to={`/courses/${item.courseId}/lectures/${item.lectureId}`}
                        className="flex justify-between items-center p-3 rounded-lg bg-gray-900 border border-gray-700 hover:border-yellow-400/50 hover:bg-gray-750 transition-colors group"
                    >
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-gray-300 font-semibold text-sm truncate group-hover:text-yellow-400 transition-colors">{item.courseTitle}</h4>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{item.lectureTitle}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <span className="text-yellow-400 font-bold text-sm block">~{item.plannedMinutes}m</span>
                            <span className="text-xs text-gray-600 font-medium tracking-wider">ESTIMATE</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default StudyPlan;
