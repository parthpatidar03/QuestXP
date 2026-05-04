import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';
import LandingPage from './pages/LandingPage';
import Profile from './pages/Profile';
import Roadmap from './pages/Roadmap';
import GamificationOverlay from './components/Gamification/GamificationOverlay';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
    );
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
    const { checkAuth, isLoading } = useAuthStore();

    useEffect(() => {
        checkAuth();
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
                <Route path="/courses/:courseId/roadmap" element={
                    <ProtectedRoute><Roadmap /></ProtectedRoute>
                } />
                <Route path="/courses/:courseId/lectures/:lectureId" element={
                    <ProtectedRoute><Player /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute><Profile /></ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
};

export default () => <ErrorBoundary><App /></ErrorBoundary>;
