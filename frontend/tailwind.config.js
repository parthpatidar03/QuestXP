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
        display: ["'Baloo 2'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ["'Nunito'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
        sans: ["'Nunito'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '400px',
      },
      borderRadius: {
        'clay-sm': 'var(--radius-sm)',
        'clay': 'var(--radius-md)',
        'clay-lg': 'var(--radius-lg)',
        'clay-xl': 'var(--radius-xl)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'clay': '10px 10px 22px var(--clay-dark), -8px -8px 20px var(--clay-light), inset -5px -5px 12px var(--clay-rim), inset 6px 6px 14px var(--clay-rim-light)',
        'clay-sm': '5px 5px 12px var(--clay-dark), -4px -4px 10px var(--clay-light), inset -3px -3px 7px var(--clay-rim), inset 3px 3px 8px var(--clay-rim-light)',
        'clay-sunk': 'inset 7px 7px 14px var(--clay-sunk-dark), inset -7px -7px 14px var(--clay-sunk-light)',
      },
      transitionTimingFunction: {
        'clay': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        sparkle: {
          "0%, 100%": { opacity: "0.75", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        sparkle: "sparkle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
