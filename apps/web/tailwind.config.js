/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        title: ['Cinzel', 'serif'],
        medieval: ['MedievalSharp', 'cursive'],
      },
      colors: {
        house: {
          red: '#dc2626',
          blue: '#2563eb',
          green: '#16a34a',
          amber: '#d97706',
          ruin: '#52525b',
        }
      }
    },
  },
  plugins: [],
}
