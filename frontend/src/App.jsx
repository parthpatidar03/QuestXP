import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
    const { checkAuth, isLoading } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center flex-col gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-yellow-400 animate-spin"></div>
                <div className="text-white text-lg font-medium tracking-widest text-gray-400">INITIALIZING</div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
            </Routes>
        </BrowserRouter>
    );
};

export default App;
