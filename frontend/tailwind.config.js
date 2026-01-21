// 42Nexus - Tailwind Configuration
// This file is for: FATYZA (Frontend Developer)

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        '42-teal': '#00babc',
        '42-dark': '#1a1a2e',
        '42-darker': '#16213e',
      },
    },
  },
  plugins: [],
}
