/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f5f3',
        ink: '#1a1a18',
        line: '#e0ddd6',
        muted: '#888',
        win: '#1D9E75',
        loss: '#E24B4A',
        pending: '#BA7517',
        accent: '#185FA5',
        'accent-dark': '#0C447C',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: {
        app: '480px',
      },
    },
  },
  plugins: [],
};
