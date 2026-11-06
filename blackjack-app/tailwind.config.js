/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: { 950: '#03140d', 900: '#062419', 800: '#0a3524', 700: '#0e4630', 600: '#135a3d', 500: '#1a704c' },
        ink: { 950: '#07080a', 900: '#0d0f12', 850: '#121519', 800: '#171b20', 700: '#20252c', 600: '#2c333c', 500: '#3d4652' },
        gold: { 50: '#fbf6e6', 100: '#f4e7bf', 200: '#ead28c', 300: '#dfbb5d', 400: '#d4a63b', 500: '#b98b26', 600: '#94691c', 700: '#6e4d17' },
        cream: { 50: '#fffdf7', 100: '#fbf6ea', 200: '#f3ead3', 300: '#e6d9b8' },
        ruby: { 400: '#e0566b', 500: '#c43a4f', 600: '#9d2a3c' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,.6) inset, 0 6px 14px rgba(0,0,0,.45), 0 1px 3px rgba(0,0,0,.5)',
        gold: '0 0 0 1px rgba(212,166,59,.45), 0 8px 30px rgba(0,0,0,.45)',
        glow: '0 0 24px rgba(212,166,59,.35)',
      },
    },
  },
  plugins: [],
}
