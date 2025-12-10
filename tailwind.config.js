/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./app/**/*.{js,jsx,ts,tsx}"  // <--- THIS TELLS IT TO LOOK IN THE APP FOLDER
  ],
  theme: {
    extend: {
      colors: {
        obsidian :'#1A0B2E',
        cream : '#FDFBF7',
        brige : '#F5E6D3',
        gold : '#FFD700',


        primary : '#1A0B2E',
        background : '#FDFBF7',
        card :'#FFFFFF',
        text : "#1A0B2E",
    },
  },
},
  plugins: [],
}