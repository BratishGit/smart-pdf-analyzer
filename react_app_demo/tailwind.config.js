/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bgDark: 'var(--bg-dark)',
        bgCard: 'var(--bg-card)',
        bgElevated: 'var(--bg-elevated)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        accentLight: 'var(--accent-light)',
        accentGlow: 'var(--accent-glow)',
        accent2: 'var(--accent2)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warn: 'var(--warn)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
