const DEFAULT_ACCENT = "#5b50f5";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");
}

// negative percent = darker (toward black), positive = lighter (toward white)
function shade(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (percent < 0) {
    const p = 1 + percent;
    return rgbToHex(r * p, g * p, b * p);
  }
  return rgbToHex(r + (255 - r) * percent, g + (255 - g) * percent, b + (255 - b) * percent);
}

export function isValidHex(hex: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
}

export interface BrandTheme {
  accent: string;
  accentHover: string;
  accentSoft: string;
}

// Derives the app's live accent + its hover/soft-tint variants from the
// school's configured brand colour (Settings > Branding), falling back to the
// default indigo when nothing has been set yet or the stored value is invalid.
export function computeBrandTheme(primaryColor?: string | null): BrandTheme {
  const base = primaryColor && isValidHex(primaryColor) ? primaryColor : DEFAULT_ACCENT;
  return {
    accent: base,
    accentHover: shade(base, -0.12),
    accentSoft: shade(base, 0.92),
  };
}
