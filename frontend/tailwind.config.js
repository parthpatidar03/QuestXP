/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        surface: '#0A0A0A',
        'surface-2': '#141414',
        border: '#262626',
        primary: { DEFAULT: '#38BDF8', hover: '#0EA5E9' },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'xp-gold': '#F59E0B',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
