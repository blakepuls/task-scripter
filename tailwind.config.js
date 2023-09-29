/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        dark: {
          ...require("daisyui/src/theming/themes")["[data-theme=dark]"],
          primary: "#8423d9",
          secondary: "#f6d860",
          accent: "#37cdbe",
          neutral: "#3d4451",

          "base-100": "#0F0F13",
          "base-200": "#1d1d24",
          "base-300": "#282834",
        },
      },
      "light",
    ],
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
