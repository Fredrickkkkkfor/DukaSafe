import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1A3C34",
        sage: "#4A7C6F",
        amber: "#C8965A",
        sand: "#F5F0E8",
        charcoal: "#2D2D2D",
        ivory: "#FAFAF7"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(26, 60, 52, 0.12)",
        glass: "0 24px 80px rgba(26, 60, 52, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
