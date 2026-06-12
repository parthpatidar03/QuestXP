import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { BGPattern } from '../components/ui/bg-pattern';
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
                <BGPattern variant="grid" mask="fade-edges" fill="var(--color-text-muted)" className="opacity-20" />
                
                <div className="relative z-10 mb-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-surface border border-border rounded-xl flex items-center justify-center mb-4 shadow-card">
                        <img src="/favicon.png" alt="QuestXP Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-text-primary font-semibold text-3xl tracking-tight">QuestXP</h1>
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
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-surface shadow-sm dark:border-neutral-900">
          {currentTab === 0 && firstTab}
          {currentTab === 1 && secondTab}
        </div>
      </div>
    )
  }
  
const Switch = ({ setTab, currentTab }) => (
    <div
      className={`relative flex w-full items-center rounded-lg bg-neutral-100 py-1 text-neutral-900 dark:bg-[#1C1C1C] dark:text-neutral-400 border border-transparent dark:border-neutral-800`}>
      <motion.div
        transition={{ type: 'keyframes', duration: 0.15, ease: 'easeInOut' }}
        animate={currentTab === 0 ? { x: 4 } : { x: '98%' }}
        initial={currentTab === 0 ? { x: 4 } : { x: '98%' }}
        className={`absolute h-5/6 w-1/2 rounded-md bg-white shadow-sm dark:bg-[#2C2C2C] dark:text-white`}
      />
      <button
        type="button"
        onClick={() => setTab(0)}
        className={`z-10 h-9 w-full rounded-md text-center text-sm font-medium transition-colors ${currentTab === 0 ? 'text-black dark:text-white' : 'hover:text-black dark:hover:text-white'}`}>
        Sign in
      </button>
      <button
        type="button"
        onClick={() => setTab(1)}
        className={`z-10 h-9 w-full rounded-md text-center text-sm font-medium transition-colors ${currentTab === 1 ? 'text-black dark:text-white' : 'hover:text-black dark:hover:text-white'}`}>
        Sign up
      </button>
    </div>
)

const SignInTab = ({ email, setEmail, password, setPassword, handleSubmit, submitting, error, handleGoogleSuccess, handleGoogleError }) => (
    <div className="flex w-full flex-col items-start justify-start gap-4 p-5 pb-6">
      <div>
        <h1 className="font-semibold text-lg text-text-primary">Sign in to your account</h1>
      </div>
      
      {error && (
        <div className="bg-danger/10 w-full border border-danger/30 text-danger p-3 rounded-lg text-sm text-center">
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
              className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-800 dark:border-neutral-800 dark:bg-[#1C1C1C] dark:text-white dark:placeholder-neutral-600 transition-all"
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
              className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-800 dark:border-neutral-800 dark:bg-[#1C1C1C] dark:text-white dark:placeholder-neutral-600 transition-all"
            />
          </div>
          <div className="mt-2.5 w-full">
            <button type="submit" disabled={submitting} className="h-10 w-full rounded-md bg-neutral-900 font-medium text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? 'Signing in...' : 'Submit'}
            </button>
          </div>
      </form>
  
      <div className="relative mt-4 w-full">
        <div className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-xs text-neutral-500 dark:bg-surface dark:text-neutral-500">
          Or
        </div>
        <div className="border-b border-neutral-200 dark:border-neutral-800"></div>
      </div>
      
      <div className="mt-4 flex w-full flex-col gap-3 items-center">
        <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:w-full overflow-hidden rounded-md border border-border">
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
        <h1 className="font-semibold text-lg text-text-primary">Create an account</h1>
      </div>
      
      {error && (
        <div className="bg-danger/10 w-full border border-danger/30 text-danger p-3 rounded-lg text-sm text-center">
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
              className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-800 dark:border-neutral-800 dark:bg-[#1C1C1C] dark:text-white dark:placeholder-neutral-600 transition-all"
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
              className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-800 dark:border-neutral-800 dark:bg-[#1C1C1C] dark:text-white dark:placeholder-neutral-600 transition-all"
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
              className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-800 dark:border-neutral-800 dark:bg-[#1C1C1C] dark:text-white dark:placeholder-neutral-600 transition-all"
            />
          </div>
          <div className="mt-2.5 w-full">
            <button type="submit" disabled={submitting} className="h-10 w-full rounded-md bg-neutral-900 font-medium text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? 'Creating...' : 'Submit'}
            </button>
          </div>
      </form>
  
      <div className="relative mt-4 w-full">
        <div className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-xs text-neutral-500 dark:bg-surface dark:text-neutral-500">
          Or
        </div>
        <div className="border-b border-neutral-200 dark:border-neutral-800"></div>
      </div>
      
      <div className="mt-4 flex w-full flex-col gap-3 items-center">
        <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:w-full overflow-hidden rounded-md border border-border">
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
