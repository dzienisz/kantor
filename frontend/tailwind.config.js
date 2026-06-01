/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          500: "#1f6feb",
          600: "#1a5fd0",
          700: "#164fae",
          900: "#0b2a63",
        },
      },
    },
  },
  plugins: [],
};
