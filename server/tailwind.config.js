/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0A0A0A',
          800: '#121212',
          700: '#1A1A1A',
          600: '#222222',
          500: '#2A2A2A',
          400: '#333333',
        },
        glow: {
          purple: '#9333EA',
          blue: '#3B82F6',
          cyan: '#06B6D4',
        }
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(147, 51, 234, 0.5)',
        'glow-md': '0 0 20px rgba(147, 51, 234, 0.5)',
        'glow-lg': '0 0 30px rgba(147, 51, 234, 0.5)',
        'glow-blue-sm': '0 0 10px rgba(59, 130, 246, 0.5)',
        'glow-blue-md': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-cyan-sm': '0 0 10px rgba(6, 182, 212, 0.5)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(147, 51, 234, 0.7)' },
          '50%': { boxShadow: '0 0 25px rgba(147, 51, 234, 0.9)' },
        },
      },
    },
  },
  plugins: [],
};