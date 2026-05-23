import React, { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import GamificationOverlay from './components/Gamification/GamificationOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import PomodoroTimer from './components/PomodoroTimer';
import useHeartbeat from './hooks/useHeartbeat';
import GlobalInteractiveEffect from './components/ui/GlobalInteractiveEffect';
import { requestNotificationPermission } from './services/firebase';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

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
const FriendZones = lazy(() => import('./pages/FriendZones'));
const FriendZoneDetail = lazy(() => import('./pages/FriendZoneDetail'));
const JoinFriendZone = lazy(() => import('./pages/JoinFriendZone'));

const PageLoader = () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        <div className="text-xs font-mono tracking-wide uppercase text-text-muted">Loading Engine</div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    const location = useLocation();
    const isDemo = new URLSearchParams(location.search).get('demo') === 'true';

    // Mirror the AppContent safety net: never spin longer than 5s here either.
    const [bailout, setBailout] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setBailout(true), 5000);
        return () => clearTimeout(t);
    }, []);

    if (isLoading && !bailout) return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
    );

    if (isAuthenticated || isDemo) return children;

    return <Navigate to="/login" replace />;
};



const AppContent = () => {
    const { checkAuth, isLoading, isAuthenticated } = useAuthStore();
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
            requestNotificationPermission();
        }
    }, [isAuthenticated]);

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

    // Public pages shouldn't be blocked by global loading state
    const isPublicPage = ['/', '/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/share/');
    const showPomodoro = isAuthenticated && !isPublicPage;

    if (isLoading && !isPublicPage && !hardLoaded) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                <div className="text-xs font-mono tracking-wide uppercase text-text-muted">Loading</div>
            </div>
        );
    }


    return (
        <div className="relative min-h-screen bg-bg cursor-crosshair">
            <Toaster 
                position="top-center" 
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '14px',
                        fontFamily: 'inherit'
                    }
                }}
            />
            <GlobalInteractiveEffect />
            <GamificationOverlay />
            {showPomodoro && <PomodoroTimer />}
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
                </Routes>
            </Suspense>
        </div>
    );
};

const App = () => {
    useEffect(() => {
        const lenis = new Lenis({
            autoRaf: true,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        return () => {
            lenis.destroy();
        };
    }, []);

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
