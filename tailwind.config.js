/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff5f5',
          100: '#ffe3e3',
          200: '#ffbbbb',
          500: '#CC0000',
          600: '#b30000',
          700: '#990000',
          800: '#800000',
        },
      },
    },
  },
  plugins: [],
};
