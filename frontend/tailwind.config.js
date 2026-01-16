/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}", // Added .ts/.tsx in case you use TypeScript later
  ],
  darkMode: 'class', // This enables dark mode using the 'dark' class on <html>
  theme: {
    extend: {
      colors: {
        // Optional: Custom light blue shades for consistency
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // This matches blue-500
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};