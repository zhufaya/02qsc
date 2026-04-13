/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-slower': 'spin 5s linear infinite',
        'spin-reverse': 'spin 1s linear infinite reverse',
        'spin-reverse-slow': 'spin 4s linear infinite reverse',
      },
      colors: {
        'hud-cyan': '#00ffff',
        'hud-blue': '#0077ff',
        'hud-bg': '#0a0a0f',
      },
    },
  },
  plugins: [],
}