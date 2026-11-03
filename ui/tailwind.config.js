/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0d14',
          panel: '#111726',
          border: '#1f293d',
          neon: '#00ffcc',
          purple: '#8a2be2',
          orange: '#ff8800',
          red: '#ff3366',
        }
      }
    },
  },
  plugins: [],
}
