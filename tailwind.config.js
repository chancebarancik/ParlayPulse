/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dk: {
          bg: '#121212',
          surface: '#1a1a2e',
          card: '#1e1e32',
          cardHover: '#252540',
          border: '#2a2a45',
          green: '#00b159',
          greenDark: '#009e4f',
          greenLight: '#00c964',
          orange: '#f5a623',
          red: '#e24b4a',
          text: '#ffffff',
          textSecondary: '#9ca3af',
          textMuted: '#6b7280',
          accent: '#5b6cf7',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
