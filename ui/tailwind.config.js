/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        otari: {
          dark: '#08090A',
          surface: '#0E1218',
          elevated: '#131822',
          border: '#1E2736',
          borderLight: '#2A364A',
          teal: '#00C4B4',
          tealHover: '#00E5D0',
          tealDark: '#005B63',
          tealSubtle: 'rgba(0, 196, 180, 0.1)',
        },
        mozilla: {
          coral: '#FF5935',
          coralSubtle: 'rgba(255, 89, 53, 0.12)',
          blue: '#0060DF',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
