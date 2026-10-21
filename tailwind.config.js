/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#E8E5DF',
        'warm-white': '#F4F2ED',
        'warm-border': '#D2CEC5',
        'warm-text': '#171513',
        'warm-muted': '#6F6A63',
        'warm-light': '#9E9890',
        thread: '#6B3535',
        ink: '#0F0E0C',
      },
      fontFamily: {
        sans: ['"Figtree"', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 0 rgba(23, 21, 19, 0.04), 0 12px 32px -16px rgba(23, 21, 19, 0.18)',
        float: '0 8px 28px -12px rgba(23, 21, 19, 0.22)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        threadDraw: {
          from: { strokeDashoffset: '120' },
          to: { strokeDashoffset: '0' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(6px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        rise: 'rise 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        threadDraw: 'threadDraw 1.1s ease forwards',
      },
    },
  },
  plugins: [],
}
