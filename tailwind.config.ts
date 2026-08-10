import type { Config } from "tailwindcss";

// Design tokens carried over from the SIMASEKSI index.html prototype
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a1a2e", 900: "#0f2544", 800: "#15335c", 700: "#1c4374",
          600: "#2a5a96", 100: "#e7edf5", 50: "#f3f6fa",
        },
        gold: { 700: "#8a6a12", 600: "#a9821b", 500: "#c9a227", 400: "#dab94a", 100: "#f8f1dc" },
        ink: { 900: "#131a24", 700: "#374356", 500: "#5c6a80", 300: "#9aa7bb" },
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: { md: "10px", lg: "16px" },
    },
  },
  plugins: [],
};
export default config;
