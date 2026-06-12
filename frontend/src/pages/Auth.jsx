import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { BGPattern } from '../components/ui/bg-pattern';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    
    const { login, register, googleLogin, isAuthenticated, isLoading } = useAuthStore();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const [submitting, setSubmitting] = useState(false);

    // Map API failures to messages users can act on, not raw stack traces.
    const friendlyError = (err) => {
        if (!err) return 'Authentication failed. Please try again.';

        // Handle Network Errors (likely CORS blocks or backend down)
        if (!err.response) {
            if (err.code === 'ERR_NETWORK') {
                return 'Network failure. This is likely a CORS block. Ensure the backend is redeployed with the latest CORS fixes.';
            }
            return 'Could not reach server. Please check your internet connection.';
        }

        if (err.response?.data?.code === 'GEO_BLOCKED') {
            return 'QuestXP is available only in India right now.';
        }
        if (err.response?.data?.code === 'GEO_LOOKUP_FAILED') {
            return 'We could not verify your location. Please disable any VPN/proxy and retry.';
        }
        if (err.response?.status === 429) {
            return 'Too many attempts. Please wait a minute and try again.';
        }
        if (err.response?.status >= 500) {
            return 'Our servers are having a hiccup. Please retry in a moment.';
        }
        return (
            err.response?.data?.error ||
            err.response?.data?.errors?.[0]?.msg ||
            err.message ||
            'Authentication failed. Please try again.'
        );
    };

    const goNext = () => {
        const redirect = localStorage.getItem('redirectAfterLogin');
        if (redirect) {
            localStorage.removeItem('redirectAfterLogin');
            navigate(redirect);
        } else {
            navigate('/dashboard');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);
        try {
            if (isLogin) {
                await login(email.trim(), password);
                localStorage.setItem('justLoggedIn', 'true');
            } else {
                await register(name.trim(), email.trim(), password);
                localStorage.setItem('justSignedUp', 'true');
            }
            setPassword('');
            goNext();
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError(null);
        if (!credentialResponse?.credential) {
            setError('Google did not return a credential. Please retry.');
            return;
        }
        try {
            await googleLogin(credentialResponse.credential);
            localStorage.setItem('justLoggedIn', 'true');
            goNext();
        } catch (err) {
            setError(friendlyError(err));
        }
    };

    const handleGoogleError = () => {
        setError(
            'Google sign-in could not start. If you are on iOS Safari, please ' +
            'allow third-party cookies for accounts.google.com, or use email signup instead.'
        );
    };

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
            <div className="min-h-screen flex items-center justify-center bg-bg flex-col text-text-primary p-4 relative overflow-hidden">
                <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-20" />
                <div className="relative z-10 mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-surface border border-border rounded-xl flex items-center justify-center mb-4 shadow-card">
                        <img src="/favicon.png" alt="QuestXP Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-text-primary font-semibold text-3xl tracking-tight">QuestXP</h1>
                    <p className="text-text-secondary mt-2">Structured learning from YouTube playlists.</p>
                </div>

                <div className="relative z-10 bg-surface p-8 rounded-xl shadow-card w-full max-w-md border border-border">
                    <h2 className="text-2xl font-semibold mb-2 text-center text-text-primary">
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="text-sm text-text-secondary text-center mb-6">
                        {isLogin ? 'Sign in to continue studying.' : 'Start tracking progress across your courses.'}
                    </p>
                    
                    {error && (
                        <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-text-secondary">Name</label>
                                <input
                                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full p-3 bg-surface-2 rounded-md border border-border focus:border-primary outline-none transition-colors text-text-primary placeholder:text-text-muted"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-text-secondary">Email</label>
                            <input
                                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-surface-2 rounded-md border border-border focus:border-primary outline-none transition-colors text-text-primary placeholder:text-text-muted"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-text-secondary">Password</label>
                            <input
                                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-surface-2 rounded-md border border-border focus:border-primary outline-none transition-colors text-text-primary placeholder:text-text-muted"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full py-3 mt-4 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-8 flex flex-col items-center gap-6">
                        <div className="relative w-full flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                            <span className="relative bg-surface px-4 text-xs font-semibold uppercase tracking-wider text-text-muted">or continue with</span>
                        </div>

                        <div className="w-full flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="outline"
                                shape="rectangular"
                                size="large"
                                text={isLogin ? "signin_with" : "signup_with"}
                                useOneTap={false}
                                auto_select={false}
                            />
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-text-secondary">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:text-primary-hover transition-colors font-medium ml-1">
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Auth;
