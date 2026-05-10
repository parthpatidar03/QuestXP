import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import GamificationOverlay from './components/Gamification/GamificationOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import PomodoroTimer from './components/PomodoroTimer';

// Lazy load pages for performance
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Player = lazy(() => import('./pages/Player'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Profile = lazy(() => import('./pages/Profile'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'));
const SharePage = lazy(() => import('./pages/SharePage'));

const PageLoader = () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        <div className="text-xs font-mono tracking-wide uppercase text-text-muted">Loading Engine</div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
    );
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

import useHeartbeat from './hooks/useHeartbeat';

const App = () => {
    const { checkAuth, isLoading } = useAuthStore();
    useHeartbeat();

    useEffect(() => {
        checkAuth();
        // Force dark mode for now as requested, or load from localStorage
        const theme = localStorage.getItem('theme') || 'dark';
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                <div className="text-xs font-mono tracking-wide uppercase text-text-muted">Loading</div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <GamificationOverlay />
            <PomodoroTimer />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/register" element={<Auth />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />
                    <Route path="/courses/:courseId" element={
                        <ProtectedRoute><CourseDetail /></ProtectedRoute>
                    } />
                    <Route path="/roadmap" element={
                        <ProtectedRoute><Roadmap /></ProtectedRoute>
                    } />
                    <Route path="/courses/:courseId/lectures/:lectureId" element={
                        <ProtectedRoute><Player /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />
                    <Route path="/admin/feedback" element={
                        <ProtectedRoute><AdminFeedback /></ProtectedRoute>
                    } />
                    <Route path="/share/:courseId" element={<SharePage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

export default () => <ErrorBoundary><App /></ErrorBoundary>;
