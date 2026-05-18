/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#08101A',
          accent: '#45F882',
          surface: '#101C2A',
          muted: '#8AA3BD',
          lightBg: '#F4F6FA'
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif']
      },
      transitionDuration: {
        '3xl': '380ms'
      },
      boxShadow: {
        elevated: '0 28px 70px -28px rgba(0, 0, 0, 0.75)',
        soft: '0 18px 40px -22px rgba(7, 16, 26, 0.65)'
      }
    }
  },
  plugins: []
};
