import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171a1f",
        paper: "#f6f5f2",
        accent: "#1f6f78",
        accentSoft: "#e7f1f1",
        line: "#e3e1da",
        // DISC factor colors
        D: "#c0563f",
        I: "#d9a441",
        S: "#3f8f6b",
        C: "#3f6fb0",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
