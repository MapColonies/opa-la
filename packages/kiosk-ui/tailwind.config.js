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
      keyframes: {
        breathing: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59,130,246,0.15)' },
          '50%': { transform: 'scale(1.04)', boxShadow: '0 0 16px 0 rgba(59,130,246,0.25)' },
        },
      },
      animation: {
        breathing: 'breathing 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true, // Enable RTL support
  },
};
