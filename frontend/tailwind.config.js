/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'oklch(0.975 0.006 88)',
        surface: 'oklch(0.995 0.004 88)',
        'surface-2': 'oklch(0.955 0.006 88)',
        'surface-3': 'oklch(0.925 0.007 88)',
        border: 'oklch(0.86 0.008 88)',

        primary: { DEFAULT: 'oklch(0.47 0.095 155)', hover: 'oklch(0.41 0.095 155)' },
        cyan: 'oklch(0.55 0.08 200)',
        gold: 'oklch(0.68 0.13 78)',
        success: 'oklch(0.54 0.11 155)',
        warning: 'oklch(0.71 0.14 70)',
        danger: 'oklch(0.56 0.18 28)',
        'xp-gold': 'oklch(0.68 0.13 78)',

        'text-primary': 'oklch(0.23 0.018 88)',
        'text-secondary': 'oklch(0.43 0.018 88)',
        'text-muted': 'oklch(0.60 0.014 88)',
      },
      fontFamily: {
        display: ["'Inter'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ["'Inter'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
        sans: ["'Inter'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px oklch(0.23 0.018 88 / 0.08), 0 12px 28px oklch(0.23 0.018 88 / 0.08)',
      },
    },
  },
  plugins: [],
}
