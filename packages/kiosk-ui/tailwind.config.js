/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif', 'Arial', 'Helvetica Neue', 'Helvetica'],
        hebrew: ['Roboto', 'Assistant', 'Heebo', 'David', 'Noto Sans Hebrew', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true, // Enable RTL support
  },
};
