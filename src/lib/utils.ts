import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function currency(value: number | string | { toString(): string }) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(value));
}

// Ghana GES grading scale
export function gradeFromScore(score: number, maxScore = 100): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return "A1";
  if (pct >= 70) return "B2";
  if (pct >= 60) return "B3";
  if (pct >= 50) return "C4";
  if (pct >= 45) return "C5";
  if (pct >= 40) return "C6";
  if (pct >= 35) return "D7";
  if (pct >= 30) return "E8";
  return "F9";
}

export function gradeRemark(grade: string): string {
  const remarks: Record<string, string> = {
    A1: "Excellent", B2: "Very Good", B3: "Good",
    C4: "Credit", C5: "Credit", C6: "Credit",
    D7: "Pass", E8: "Pass", F9: "Fail"
  };
  return remarks[grade] ?? "";
}
