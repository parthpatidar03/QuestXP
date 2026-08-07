import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Auth = () => {
    const [currentTab, setCurrentTab] = useState(0); // 0 for Sign in, 1 for Sign up
    const isLogin = currentTab === 0;

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

    const friendlyError = (err) => {
        if (!err) return 'Authentication failed. Please try again.';

        if (!err.response) {
            if (err.code === 'ERR_NETWORK') {
                return 'Network failure. Ensure the backend is redeployed with the latest CORS fixes.';
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
                
                <div className="relative z-10 mb-6 flex flex-col items-center">
                    <div className="w-16 h-16 clay rounded-clay flex items-center justify-center mb-4 ">
                        <img src="/favicon.png" alt="QuestXP Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-text-primary font-display font-bold text-3xl tracking-tight">QuestXP</h1>
                </div>

                <div className="relative z-10 w-full max-w-[400px]">
                    <Account 
                        currentTab={currentTab} 
                        setCurrentTab={setCurrentTab}
                        firstTab={
                            <SignInTab 
                                email={email} setEmail={setEmail}
                                password={password} setPassword={setPassword}
                                handleSubmit={handleSubmit} submitting={submitting}
                                error={error} handleGoogleSuccess={handleGoogleSuccess} handleGoogleError={handleGoogleError}
                            />
                        }
                        secondTab={
                            <SignUpTab 
                                name={name} setName={setName}
                                email={email} setEmail={setEmail}
                                password={password} setPassword={setPassword}
                                handleSubmit={handleSubmit} submitting={submitting}
                                error={error} handleGoogleSuccess={handleGoogleSuccess} handleGoogleError={handleGoogleError}
                            />
                        }
                    />
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export const Account = ({ currentTab, setCurrentTab, firstTab, secondTab }) => {
    return (
      <div className="flex w-full flex-col gap-2">
        <Switch currentTab={currentTab} setTab={setCurrentTab} />
        <div className="clay overflow-hidden rounded-clay-lg mt-2">
          {currentTab === 0 && firstTab}
          {currentTab === 1 && secondTab}
        </div>
      </div>
    )
  }
  
const Switch = ({ setTab, currentTab }) => (
    <div
      className="clay-sunk relative flex w-full items-center rounded-clay p-1.5 text-text-secondary">
      {/* Pill is inset by the container's 6px padding, so a 100% shift of its
          own width lands it flush against the opposite inner edge. */}
      <motion.div
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        animate={{ x: currentTab === 0 ? '0%' : '100%' }}
        initial={{ x: currentTab === 0 ? '0%' : '100%' }}
        className="clay-sm absolute left-1.5 h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-clay-sm"
      />
      <button
        type="button"
        onClick={() => setTab(0)}
        className={`z-10 h-11 w-full rounded-clay-sm text-center text-sm font-bold transition-colors ${currentTab === 0 ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`}>
        Sign in
      </button>
      <button
        type="button"
        onClick={() => setTab(1)}
        className={`z-10 h-11 w-full rounded-clay-sm text-center text-sm font-bold transition-colors ${currentTab === 1 ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`}>
        Sign up
      </button>
    </div>
)

const SignInTab = ({ email, setEmail, password, setPassword, handleSubmit, submitting, error, handleGoogleSuccess, handleGoogleError }) => (
    <div className="flex w-full flex-col items-start justify-start gap-4 p-5 pb-6">
      <div>
        <h1 className="font-display font-bold text-xl text-text-primary">Sign in to your account</h1>
      </div>
      
      {error && (
        <div className="bg-danger/10 w-full border border-danger/30 text-danger p-3 rounded-clay-sm text-sm text-center">
            {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="w-full">
            <label htmlFor="email" className="text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              name="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="clay-input mt-1.5"
            />
          </div>
          <div className="w-full">
            <label htmlFor="password" className="text-sm font-medium text-text-primary">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="clay-input mt-1.5"
            />
          </div>
          <div className="mt-2.5 w-full">
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
      </form>
  
      <div className="relative mt-4 w-full">
        <div className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-xs font-bold text-text-muted">
          Or
        </div>
        <div className="border-b border-border "></div>
      </div>
      
      <div className="mt-4 flex w-full flex-col gap-3 items-center">
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="signin_with"
            useOneTap={false}
            auto_select={false}
          />
        </div>
      </div>
    </div>
)
  
const SignUpTab = ({ name, setName, email, setEmail, password, setPassword, handleSubmit, submitting, error, handleGoogleSuccess, handleGoogleError }) => (
    <div className="flex w-full flex-col items-start justify-start gap-4 p-5 pb-6">
      <div>
        <h1 className="font-display font-bold text-xl text-text-primary">Create an account</h1>
      </div>
      
      {error && (
        <div className="bg-danger/10 w-full border border-danger/30 text-danger p-3 rounded-clay-sm text-sm text-center">
            {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="w-full">
            <label htmlFor="name" className="text-sm font-medium text-text-primary">
              Name
            </label>
            <input
              name="name"
              placeholder="John Doe"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="clay-input mt-1.5"
            />
          </div>
          <div className="w-full">
            <label htmlFor="email" className="text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              name="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="clay-input mt-1.5"
            />
          </div>
          <div className="w-full">
            <label htmlFor="password" className="text-sm font-medium text-text-primary">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="clay-input mt-1.5"
            />
          </div>
          <div className="mt-2.5 w-full">
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
      </form>
  
      <div className="relative mt-4 w-full">
        <div className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-xs font-bold text-text-muted">
          Or
        </div>
        <div className="border-b border-border "></div>
      </div>
      
      <div className="mt-4 flex w-full flex-col gap-3 items-center">
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="signup_with"
            useOneTap={false}
            auto_select={false}
          />
        </div>
      </div>
    </div>
)

export default Auth;
