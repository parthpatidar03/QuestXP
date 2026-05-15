import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';

import { HelmetProvider } from 'react-helmet-async';
import { installGlobalHandlers } from './utils/clientLogger';

// Install before anything else so we catch errors in early bootstrap.
installGlobalHandlers();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Build-time guard: surface missing Google Client ID loudly ───────────────
// Previously this silently defaulted to the string "placeholder", which made
// the Google library fail at sign-in with an opaque error and no clue that the
// env var was missing. We now warn loudly in the console (every load) and put
// a visible banner on the page in production builds when it's absent.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  // eslint-disable-next-line no-console
  console.error(
    '[QuestXP] VITE_GOOGLE_CLIENT_ID is NOT set at build time. ' +
    'Google sign-in will fail. Set it in the Vercel project env vars ' +
    'and redeploy.'
  );
  if (import.meta.env.PROD) {
    // Inject a small banner so misconfigured deployments are visually obvious.
    const banner = document.createElement('div');
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:99999;padding:8px 12px;' +
      'background:#7f1d1d;color:#fff;font:600 13px system-ui;text-align:center';
    banner.textContent =
      'Configuration error: Google sign-in unavailable (missing VITE_GOOGLE_CLIENT_ID).';
    document.body.appendChild(banner);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ''}>
          <App />
          <Analytics />
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
