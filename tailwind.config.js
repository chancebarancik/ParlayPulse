/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dk: {
          bg: '#0a0a0f',
          surface: '#12121a',
          card: '#16161f',
          cardHover: '#1c1c28',
          border: '#1f1f2e',
          borderLight: '#2a2a3d',
          green: '#10b981',
          greenDark: '#059669',
          greenLight: '#34d399',
          greenMuted: 'rgba(16, 185, 129, 0.08)',
          orange: '#f59e0b',
          red: '#ef4444',
          text: '#f1f1f4',
          textSecondary: '#8b8b9e',
          textMuted: '#55556a',
          accent: '#6366f1',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
