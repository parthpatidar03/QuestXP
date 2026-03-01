import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';
import LandingPage from './pages/LandingPage';
import GamificationOverlay from './components/Gamification/GamificationOverlay';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" /></div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
    const { checkAuth, isLoading } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center flex-col gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin"></div>
                <div className="text-text-muted text-xs font-mono tracking-widest uppercase">INITIALIZING</div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <GamificationOverlay />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/courses/:courseId" element={
                    <ProtectedRoute>
                        <CourseDetail />
                    </ProtectedRoute>
                } />
                <Route path="/courses/:courseId/lectures/:lectureId" element={
                    <ProtectedRoute>
                        <Player />
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
};

export default () => <ErrorBoundary><App /></ErrorBoundary>;
