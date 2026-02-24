/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f2f5',
          100: '#d6dae3',
          200: '#adb5c7',
          300: '#8490ab',
          400: '#5b6b8f',
          500: '#3a4d73',
          600: '#2a3a5a',
          700: '#1A2B4A',
          800: '#131f36',
          900: '#0d1524',
        },
        accent: {
          green: '#2DC672',
          'green-light': '#34d97f',
          'green-dark': '#24a35d',
        },
        surface: {
          light: '#F5F7FA',
          white: '#FFFFFF',
          warm: '#FAFBFC',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
