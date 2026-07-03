import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0f172a",
        emerald: "#10b981",
        amber: "#f59e0b",
        rose: "#e11d48",
        shell: "#f8fafc",
        surface: "#ffffff",
        line: "#e2e8f0",
        muted: "#64748b",
        ink: "#191c1e"
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(15, 23, 42, 0.05)",
        lift: "0 10px 15px -3px rgba(15, 23, 42, 0.12)",
        emerald: "0 8px 24px rgba(16, 185, 129, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
