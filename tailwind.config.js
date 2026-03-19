/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F5',
        'warm-white': '#F5F1EC',
        'warm-border': '#E8E4E0',
        'warm-text': '#2D2926',
        'warm-muted': '#8A8580',
        'warm-light': '#B5B0AA',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
