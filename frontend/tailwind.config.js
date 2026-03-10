/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Esports Dark Theme ──────────────────
        bg: '#0d0f1a',
        surface: '#12152a',
        'surface-2': '#1a1e35',
        'surface-3': '#222748',
        border: '#2a2f52',

        // ── Accent Palette ──────────────────────
        primary: { DEFAULT: '#00b4ff', hover: '#0099dd' },
        cyan: '#00e5ff',
        gold: '#f5a524',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'xp-gold': '#f5a524',

        // ── Text ────────────────────────────────
        'text-primary': '#eef2ff',
        'text-secondary': '#8b9cc8',
        'text-muted': '#4a5480',
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "'Space Grotesk'", 'sans-serif'],
        body: ["'Space Grotesk'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
        sans: ["'Space Grotesk'", 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 24px rgba(0,180,255,0.35)',
        'glow-cyan': '0 0 24px rgba(0,229,255,0.40)',
        'glow-gold': '0 0 24px rgba(245,165,36,0.40)',
      },
    },
  },
  plugins: [],
}
