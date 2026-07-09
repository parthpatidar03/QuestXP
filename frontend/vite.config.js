/* global process */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// T064 — Vite dev proxy + CORS final config
// In dev, all /api requests are proxied to the backend (avoids CORS).
// In production, VITE_API_URL is set to the full backend URL.
export default defineConfig(({ mode }) => {
  // loadEnv reads .env files (and respects mode/prefixes) without leaning on
  // a globally available `process` — keeps eslint's browser config happy.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      visualizer({
        filename: 'stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ],
    server: {
      port: 5173,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
      },
      proxy: {
        '/api': {
          target: env.VITE_DEV_BACKEND || 'http://localhost:5002',
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

