/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f1115",
        surface: "#1a1d24",
        primary: "#6366f1",
        primaryHover: "#4f46e5",
        border: "#2d313a",
        rose: {
          50: 'rgb(var(--brand-50, 255 241 242) / <alpha-value>)',
          100: 'rgb(var(--brand-100, 255 228 230) / <alpha-value>)',
          200: 'rgb(var(--brand-200, 254 205 211) / <alpha-value>)',
          300: 'rgb(var(--brand-300, 253 164 175) / <alpha-value>)',
          400: 'rgb(var(--brand-400, 251 113 133) / <alpha-value>)',
          500: 'rgb(var(--brand-500, 244 63 94) / <alpha-value>)',
          600: 'rgb(var(--brand-600, 225 29 72) / <alpha-value>)',
          700: 'rgb(var(--brand-700, 190 18 60) / <alpha-value>)',
          800: 'rgb(var(--brand-800, 159 18 57) / <alpha-value>)',
          900: 'rgb(var(--brand-900, 136 19 55) / <alpha-value>)',
          950: 'rgb(var(--brand-950, 76 5 25) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
