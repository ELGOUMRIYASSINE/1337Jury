// 1337Jury - Tailwind Configuration
// This file is for: FATYZA (Frontend Developer)
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        jury: {
          primary: '#00d4aa',
          secondary: '#1a1f2e',
          dark: '#0d1117',
          darker: '#090c10',
          card: '#161b22',
          border: '#30363d',
          accent: '#238636',
          warning: '#f0b429',
          danger: '#f85149',
          coral: '#ff6b6b',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}