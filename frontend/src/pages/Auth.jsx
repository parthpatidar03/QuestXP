import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    
    const { login, register, googleLogin } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(name, email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Authentication failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError(null);
        try {
            await googleLogin(credentialResponse.credential);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Google Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg flex-col text-text-primary p-4 rounded-lg">
            {/* Logo/Brand Area */}
            <div className="mb-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
                    <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                </div>
                <h1 className="text-display text-text-primary font-bold text-3xl tracking-tight">QuestXP</h1>
                <p className="text-text-secondary mt-2">Level up your learning journey.</p>
            </div>

            <div className="bg-surface p-8 rounded-[16px] shadow-[0_25px_50px_rgba(0,0,0,0.6)] w-full max-w-md border border-border">
                <h2 className="text-h2 font-display font-semibold mb-6 text-center text-text-primary">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">
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
                    
                    <button type="submit" className="btn-primary w-full py-3 mt-4 text-[15px]">
                        {isLogin ? 'Sign In' : 'Create Account'}
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
                            onError={() => setError('Google Authentication Failed')}
                            theme="filled_black"
                            shape="rectangular"
                            size="large"
                            text={isLogin ? "signin_with" : "signup_with"}
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
    );
};

export default Auth;
