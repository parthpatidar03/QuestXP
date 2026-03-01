import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// T064 — Vite dev proxy + CORS final config
// In dev, all /api requests are proxied to the backend (avoids CORS).
// In production, VITE_API_URL is set to the full backend URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

