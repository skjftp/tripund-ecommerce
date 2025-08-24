/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7f0',
          100: '#fdeed9',
          200: '#fad8b1',
          300: '#f7bd7f',
          400: '#f2984a',
          500: '#d4a574',
          600: '#c8732a',
          700: '#a75c22',
          800: '#874b21',
          900: '#6f3f1e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}