/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./app/**/*.{js,jsx,ts,tsx}"  // <--- THIS TELLS IT TO LOOK IN THE APP FOLDER
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}