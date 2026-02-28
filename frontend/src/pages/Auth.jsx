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
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center text-yellow-400">
                    {isLogin ? 'Welcome Back to QuestXP' : 'Join QuestXP'}
                </h2>
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
                            <input 
                                type="text" value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full p-2.5 bg-gray-900 rounded border border-gray-600 focus:border-yellow-400 outline-none transition-colors"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
                        <input 
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2.5 bg-gray-900 rounded border border-gray-600 focus:border-yellow-400 outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
                        <input 
                            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 bg-gray-900 rounded border border-gray-600 focus:border-yellow-400 outline-none transition-colors"
                            required
                        />
                    </div>
                    
                    <button type="submit" className="w-full py-2.5 mt-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 transition-colors">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="relative w-full flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                        <span className="relative bg-gray-800 px-4 text-sm text-gray-400">or</span>
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

                <p className="mt-6 text-center text-sm text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                        {isLogin ? 'Sign up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;
