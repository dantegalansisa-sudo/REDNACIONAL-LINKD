/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dce8ff', 200: '#bcd3ff', 300: '#8db4ff', 400: '#5b8eff',
          500: '#2f6bff', 600: '#0b57f0', 700: '#0846c7', 800: '#0b3a9e', 900: '#0d2f7a',
        },
        navy: { 700: '#12307a', 800: '#0c2463', 900: '#0a1c4f', 950: '#071338' },
        ink: '#0a1f5c',
        rd: { red: '#e5323b', blue: '#0b3a9e' },
        accent: { orange: '#ff6a13' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        script: ['Caveat', 'cursive'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,40,100,.04), 0 4px 16px rgba(16,40,100,.06)',
        soft: '0 10px 40px rgba(10,40,120,.12)',
      },
    },
  },
  plugins: [],
}
