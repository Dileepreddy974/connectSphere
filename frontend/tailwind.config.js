/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        dark: '#1f2937',
        light: '#f9fafb',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
