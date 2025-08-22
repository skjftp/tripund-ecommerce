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
          50: '#fdf8f4',
          100: '#faeee3',
          200: '#f5dbc5',
          300: '#efc19d',
          400: '#e89d6c',
          500: '#d4a574',
          600: '#c18653',
          700: '#a16b44',
          800: '#82573b',
          900: '#6b4933',
        },
        admin: {
          sidebar: '#1e293b',
          dark: '#0f172a',
        }
      },
    },
  },
  plugins: [],
}