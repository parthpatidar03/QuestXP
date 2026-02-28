import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import CourseCard from '../components/Course/CourseCard';
import CourseCreationForm from '../components/Course/CourseCreationForm';

const Dashboard = () => {
    const { user, logout } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data } = await api.get('/courses');
                setCourses(data.courses);
            } catch (err) {
                console.error('Failed to fetch courses', err);
            }
        };
        fetchCourses();
    }, []);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Quest<span className="text-yellow-400">XP</span></h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-300 text-sm md:text-base">
                        Welcome, <span className="text-white font-semibold">{user.name}</span>!
                    </span>
                    <button 
                        onClick={logout} 
                        className="px-4 py-2 text-sm border border-gray-600 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-yellow-400">Level {user.level}</h2>
                    <p className="text-gray-400 mb-2">Total XP: <span className="text-white font-mono">{user.totalXP}</span></p>
                    <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">450 / 1000 to next level</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md flex flex-col justify-center items-center">
                    <h2 className="text-lg font-medium mb-1 text-gray-400">Current Streak</h2>
                    <p className="text-4xl font-bold text-orange-400">
                        {user.streak?.current || 0} 
                        <span className="text-base font-normal text-gray-500 ml-1">days</span>
                    </p>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="text-lg font-medium mb-2 text-gray-400">Today's Goal</h2>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300">Study Plan</span>
                        <span className="text-sm font-medium bg-gray-700 px-2 py-1 rounded">0 / 45 mins</span>
                    </div>
                </div>
            </div>

            <main className="mt-8">
                {showCreate ? (
                    <div>
                        <button onClick={() => setShowCreate(false)} className="text-sm text-gray-500 hover:text-white mb-4">&larr; Back to Courses</button>
                        <CourseCreationForm />
                    </div>
                ) : (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Your Courses</h2>
                            <button 
                                onClick={() => setShowCreate(true)}
                                className="bg-yellow-400 text-gray-900 px-4 py-2 font-semibold rounded hover:bg-yellow-300 transition-colors text-sm"
                            >
                                + New Course
                            </button>
                        </div>
                        
                        {courses.length === 0 ? (
                            <div className="text-gray-500 text-center py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
                                <svg className="w-12 h-12 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                <p className="text-lg">No courses yet.</p>
                                <p className="text-sm">Add a YouTube playlist to begin your quest!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map(course => <CourseCard key={course._id} course={course} />)}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
