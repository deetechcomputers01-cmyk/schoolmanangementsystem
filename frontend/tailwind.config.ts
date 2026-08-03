import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Stitch Pro palette (scholar-pro/desktop) */
        primary:          "#5b50f5",   /* Stitch purple — active nav, buttons, accents    */
        "primary-hover":  "#4a41d9",
        "primary-light":  "#f4f3ff",   /* Subtle purple tint                              */
        "outline-variant":"#e4e4ec",   /* Stitch border color                             */
        "on-surface":     "#111827",   /* Stitch text-main                                */
        "on-surface-variant": "#6b7280",/* Stitch text-muted                             */
        /* Backward-compat aliases used by mobile / legacy screens */
        navy:    "#5b50f5",   /* was old teal #073543 — remapped to Stitch purple accent to stop teal leaking through shared ui/* components */
        emerald: "#5D7C5C",
        amber:   "#C68B3C",
        rose:    "#B64B4B",
        shell:   "#F7F8F6",
        surface: "#ffffff",
        line:    "#e4e4ec",   /* was #D8DDD8 — aligned to Stitch outline color */
        muted:   "#858791",   /* was #71787b — aligned to Stitch on-surface-variant */
        ink:     "#16161d",   /* was #141d23 — aligned to Stitch on-surface */
        teal:    "#4d42e8",   /* was old teal-light #244c5a — remapped to Stitch accent-hover (used as navy's hover state) */
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(22,22,29,0.08)",
        lift: "0 4px 6px -1px rgba(22,22,29,0.07)",
      }
    }
  },
  plugins: []
};

export default config;
