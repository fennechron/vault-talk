/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Slate 900
        primary: "#3b82f6",    // Blue 500
        accent: "#a855f7",     // Purple 500
      },
    },
  },
  plugins: [],
}
