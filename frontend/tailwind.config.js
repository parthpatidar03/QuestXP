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
        'border-shadow': 'var(--color-border-shadow)',

        primary: { 
          DEFAULT: 'var(--color-primary)', 
          hover: 'var(--color-primary-hover)',
          shadow: 'var(--color-primary-shadow)',
        },
        cyan: {
          DEFAULT: 'var(--color-cyan)',
          shadow: 'var(--color-cyan-shadow)',
        },
        gold: {
          DEFAULT: 'var(--color-gold)',
          dim: 'var(--color-gold-dim)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: {
          DEFAULT: 'var(--color-danger)',
          shadow: 'var(--color-danger-shadow)',
        },
        'xp-gold': 'var(--color-xp-gold)',

        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        }
      },
      fontFamily: {
        display: ["'Josefin Sans'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ["'Josefin Sans'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
        sans: ["'Josefin Sans'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '400px',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
