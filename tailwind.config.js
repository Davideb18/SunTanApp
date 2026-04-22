/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accentYellow: "#FFDE00",
        accentOrange: "#FB693D",
        accentRed: "#FF0000",
      },
      borderRadius: {
        card: "24px",
      },
    },
  },
  plugins: [],
};
