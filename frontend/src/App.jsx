import React, { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';
import useHeartbeat from './hooks/useHeartbeat';

// Lazy load PomodoroTimer and GamificationOverlay to keep initial bundle light
const PomodoroTimer = lazy(() => import('./components/PomodoroTimer'));
const GamificationOverlay = lazy(() => import('./components/Gamification/GamificationOverlay'));

// Lazy load pages for performance
const Auth = lazy(() => import('./pages/Auth'));
import PageLoader from './components/ui/PageLoader';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Player = lazy(() => import('./pages/Player'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Profile = lazy(() => import('./pages/Profile'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'));
const SharePage = lazy(() => import('./pages/SharePage'));
const FriendZones = lazy(() => import('./pages/FriendZones'));
const FriendZoneDetail = lazy(() => import('./pages/FriendZoneDetail'));
const JoinFriendZone = lazy(() => import('./pages/JoinFriendZone'));



const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading, isDemoMode, enterDemoMode } = useAuthStore();
    const location = useLocation();

    // Seed demo mode from URL param on first visit (entry from landing page)
    React.useEffect(() => {
        const urlDemo = new URLSearchParams(location.search).get('demo') === 'true';
        if (urlDemo && !isDemoMode) enterDemoMode();
    }, [location.search, isDemoMode, enterDemoMode]);

    // Mirror the AppContent safety net: never spin longer than 5s here either.
    const [bailout, setBailout] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setBailout(true), 5000);
        return () => clearTimeout(t);
    }, []);

    if (isLoading && !bailout && !isDemoMode) return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
    );

    if (isAuthenticated || isDemoMode) return children;

    return <Navigate to="/login" replace />;
};



const AppContent = () => {
    const { checkAuth, isLoading, isAuthenticated, isDemoMode } = useAuthStore();
    const location = useLocation();
    useHeartbeat();

    // Safety net: if checkAuth() never resolves (backend down, hung Mongo,
    // network blackhole) the UI used to spin forever. After 5 seconds we
    // force the store out of the loading state so the user lands on /login
    // and can at least take action.
    const [hardLoaded, setHardLoaded] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setHardLoaded(true), 5000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            // Dynamically import Firebase registration to avoid pulling SDK into app shell
            import('./services/firebase').then(({ requestNotificationPermission }) => {
                requestNotificationPermission();
            }).catch(err => {
                console.error('[Firebase] Failed to load notification helper dynamically:', err);
            });
        }
    }, [isAuthenticated]);

    useEffect(() => {
        checkAuth();
        // Clay surfaces are built around a light source, so light is the
        // default. Dark is a real second theme, not a forced one.
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [checkAuth]);

    // Public pages shouldn't be blocked by global loading state
    const isPublicPage = ['/', '/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/share/');
    const showPomodoro = isAuthenticated && !isPublicPage;

    if (isLoading && !isPublicPage && !hardLoaded && !isDemoMode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                <div className="text-xs font-mono tracking-wide uppercase text-text-muted">Loading</div>
            </div>
        );
    }


    return (
        <div className="relative min-h-screen bg-bg">
            <Toaster 
                position="top-center" 
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        boxShadow: 'var(--shadow-card)',
                    }
                }}
            />
            <Suspense fallback={null}>
                <GamificationOverlay />
            </Suspense>
            {showPomodoro && (
                <Suspense fallback={null}>
                    <PomodoroTimer />
                </Suspense>
            )}
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
                    <Route path="/friendzones" element={
                        <ProtectedRoute><FriendZones /></ProtectedRoute>
                    } />
                    <Route path="/friendzones/:zoneId" element={
                        <ProtectedRoute><FriendZoneDetail /></ProtectedRoute>
                    } />
                    <Route path="/join/:inviteCode" element={<JoinFriendZone />} />
                    <Route path="*" element={
                        <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-8 text-center">
                            <div className="text-6xl mb-4">🗺️</div>
                            <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
                            <p className="text-text-secondary mb-6">This quest doesn't exist. Let's get you back on track.</p>
                            <a href="/dashboard" className="btn-primary">Back to Dashboard</a>
                        </div>
                    } />
                </Routes>
            </Suspense>
        </div>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
};

const RootApp = () => (
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

export default RootApp;
