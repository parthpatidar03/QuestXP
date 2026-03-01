import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import CourseCard from '../components/Course/CourseCard';
import CourseCreationForm from '../components/Course/CourseCreationForm';
import ProgressCard from '../components/Dashboard/ProgressCard';
import StreakWidget from '../components/Dashboard/StreakWidget';
import TodayTarget from '../components/Dashboard/TodayTarget';
import StudyPlan from '../components/Dashboard/StudyPlan';
import WeeklyGoal from '../components/Dashboard/WeeklyGoal';
import { Flame, Zap, CheckCircle, AlertTriangle, UserPlus, LogOut, BookOpen, LayoutDashboard, Settings } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data } = await api.get('/courses');
                setCourses(data.courses);

                const pMap = {};
                await Promise.all(data.courses.map(async (c) => {
                    try {
                        const pRes = await api.get(`/progress/${c._id}`);
                        if (pRes.data.progress) pMap[c._id] = pRes.data.progress;
                    } catch(e) {}
                }));
                setProgressMap(pMap);
            } catch (err) {
                console.error('Failed to fetch courses', err);
            }
        };
        fetchCourses();
    }, []);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-bg text-text-primary flex font-body">
            
            {/* Left Sidebar (Desktop) */}
            <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0 py-6 px-4">
                <div className="flex items-center gap-2 mb-10 px-2">
                    <Zap className="w-6 h-6 text-primary" />
                    <span className="text-xl font-display font-bold tracking-tight">QuestXP</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-primary/10 text-primary rounded-lg font-medium transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg font-medium transition-colors">
                        <BookOpen className="w-5 h-5" />
                        My Courses
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg font-medium transition-colors">
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-border">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-sky-500 flex items-center justify-center text-white font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold truncate">{user.name}</p>
                            <p className="text-xs text-text-muted truncate">Level {user.level} Explorer</p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg text-sm transition-colors">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
                    
                    {/* Header (Mobile Logo & Logout) */}
                    <header className="lg:hidden flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Zap className="w-6 h-6 text-primary" />
                            <span className="text-xl font-display font-bold">QuestXP</span>
                        </div>
                        <button onClick={logout} className="p-2 text-text-muted hover:text-danger bg-surface rounded-lg border border-border">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </header>

                    {/* Stats Row */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Streak */}
                        <div className="card flex flex-col items-center justify-center text-center p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Flame className="w-5 h-5 text-warning streak-flame" />
                                <span className="text-sm font-medium text-text-secondary uppercase tracking-wider">Streak</span>
                            </div>
                            <span className="text-3xl font-display font-bold text-warning">{user.streak?.current || 0}</span>
                        </div>

                        {/* Today's XP */}
                        <div className="card flex flex-col items-center justify-center text-center p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-5 h-5 text-warning" />
                                <span className="text-sm font-medium text-text-secondary uppercase tracking-wider">Today's XP</span>
                            </div>
                            <span className="text-3xl font-display font-bold text-warning">+{user.xpToday || 0}</span>
                        </div>

                        {/* Level Ring (Placeholder simple circle for now until RadialBar applies) */}
                        <div className="card flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5"></div>
                            <span className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2 relative z-10">Level</span>
                            <div className="w-14 h-14 rounded-full border-4 border-primary flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(56,189,248,0.3)] bg-surface">
                                <span className="text-xl font-display font-bold text-text-primary">{user.level || 1}</span>
                            </div>
                        </div>

                        {/* Weekly Goal */}
                        <WeeklyGoal courseId={courses[0]?._id} />
                    </section>

                    {/* Today's Target */}
                    <section>
                        <TodayTarget />
                    </section>
                    
                    {/* 4-Week Study Plan */}
                    {(courses.length > 0 || progressMap) && (
                        <section>
                            <StudyPlan courseId={courses[0]?._id} />
                        </section>
                    )}
                    
                    {/* Active Courses (Continue Learning progress cards) */}
                    {courses.length > 0 && (
                        <section>
                            <h2 className="text-text-primary text-xl font-display font-semibold mb-4">Continue Learning</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {courses.map(course => (
                                    <ProgressCard key={course._id} course={course} progress={progressMap[course._id]} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Enrolled Courses Grid */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-text-primary text-xl font-display font-semibold">Your Library</h2>
                            <button 
                                onClick={() => setShowCreate(!showCreate)}
                                className="btn-primary py-2 px-4 text-xs"
                            >
                                {showCreate ? 'Cancel' : '+ New Course'}
                            </button>
                        </div>
                        
                        {showCreate ? (
                            <CourseCreationForm />
                        ) : (
                            courses.length === 0 ? (
                                <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed">
                                    <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                                        <BookOpen className="w-8 h-8 text-text-muted" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-text-primary mb-2">No courses yet</h3>
                                    <p className="text-text-secondary text-sm mb-6 max-w-sm">
                                        Paste a YouTube playlist URL to generate your first structured, gamified course.
                                    </p>
                                    <button onClick={() => setShowCreate(true)} className="btn-primary">
                                        Create First Course
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {courses.map(course => <CourseCard key={course._id} course={course} />)}
                                </div>
                            )
                        )}
                    </section>

                </div>
            </main>

            {/* Right Column (Friend Feed) - Hidden on smaller screens */}
            <aside className="hidden xl:block w-72 bg-surface border-l border-border h-screen sticky top-0 py-6 px-4">
                <h3 className="text-sm font-display font-semibold text-text-secondary uppercase tracking-wider mb-6">Friend Leaderboard</h3>
                
                <div className="space-y-4">
                     {/* Empty state for friends feed */}
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3">
                            <UserPlus className="w-5 h-5 text-text-muted" />
                        </div>
                        <p className="text-sm text-text-secondary mb-4">Learning is better together.</p>
                        <button className="text-primary text-sm font-semibold hover:text-primary-hover transition-colors">
                            Invite Friends
                        </button>
                    </div>
                </div>
            </aside>
            
        </div>
    );
};

export default Dashboard;
