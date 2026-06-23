/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f0faf4',
          100: '#d8f3e6',
          200: '#b1e7cc',
          300: '#74C69D',
          400: '#52B788',
          500: '#2D6A4F',
          600: '#1F5C3F',
          700: '#1B4332',
          800: '#14402A',
          900: '#0F2E1D',
        },
        cream: {
          50:  '#FEFAF0',
          100: '#F5EDD6',
          200: '#EDE0C0',
          300: '#DDD3B0',
          400: '#CAB98A',
          500: '#B8A06A',
        },
        forest: {
          50:  '#f0faf4',
          100: '#d8f3e6',
          200: '#95D5B2',
          300: '#74C69D',
          400: '#52B788',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#1F5C3F',
          800: '#1B4332',
          900: '#1B3A2A',
        },
      },
    },
  },
  plugins: [],
};
