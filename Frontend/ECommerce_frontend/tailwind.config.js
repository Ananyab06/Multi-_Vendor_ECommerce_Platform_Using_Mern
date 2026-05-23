/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#f4f6f8',
          100: '#e7ebf0',
          200: '#c5d0de',
          300: '#a3b5cb',
          400: '#5f7fa5',
          500: '#3c4f68', // Primary navbar steel-blue color
          600: '#36475e', // Darker shade for hover
          700: '#2e3c4f',
          800: '#263242',
          900: '#1e2834',
        },
        blue: {
          50: '#f4f6f8',
          100: '#e7ebf0',
          200: '#c5d0de',
          300: '#a3b5cb',
          400: '#5f7fa5',
          500: '#3c4f68',
          600: '#36475e',
          700: '#2e3c4f',
          800: '#263242',
          900: '#1e2834',
        }
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}