/* global process */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// T064 — Vite dev proxy + CORS final config
// In dev, all /api requests are proxied to the backend (avoids CORS).
// In production, VITE_API_URL is set to the full backend URL.
export default defineConfig(({ mode }) => {
  // loadEnv reads .env files (and respects mode/prefixes) without leaning on
  // a globally available `process` — keeps eslint's browser config happy.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_DEV_BACKEND || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  };
});

