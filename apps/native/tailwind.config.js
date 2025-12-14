/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "../../packages/ui/src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        primary: '#1DB954', // Spotify Green
        workout: '#DC2626', // Red
        chill: '#4F46E5',   // Indigo
      },
      fontFamily: {
        lato: ['Lato_400Regular'],
      },
    },
  },
  plugins: [],
}
