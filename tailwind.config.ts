import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        paper: "#FFFFFF",
        bone: "#F6F4EF",
        line: "#E3E0D8",
        rust: "#9A3B12"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"]
      },
      maxWidth: {
        content: "1180px"
      }
    }
  },
  plugins: []
};

export default config;
