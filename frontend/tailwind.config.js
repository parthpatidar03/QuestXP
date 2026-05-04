/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'surface-3': 'var(--color-surface-3)',
        border: 'var(--color-border)',

        primary: { 
          DEFAULT: 'var(--color-primary)', 
          hover: 'var(--color-primary-hover)' 
        },
        cyan: 'var(--color-cyan)',
        gold: 'var(--color-gold)',
        'gold-dim': 'var(--color-gold-dim)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        'xp-gold': 'var(--color-xp-gold)',

        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        }
      },
      fontFamily: {
        display: ["'Inter'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ["'Inter'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
        sans: ["'Inter'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
