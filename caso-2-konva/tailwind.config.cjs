/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        scene: {
          bg: "#060b15",
          panel: "rgba(9, 18, 33, 0.78)",
          accent: "#22c55e"
        }
      }
    }
  },
  plugins: []
};
