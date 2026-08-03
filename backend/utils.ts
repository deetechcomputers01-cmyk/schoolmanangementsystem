import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function currency(value: number | string | { toString(): string }) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(value));
}

export type GradeBand = { grade: string; min: number; max: number; remark?: string };

// Ghana GES grading scale — the default here matches SchoolSettings.gradingScale's
// seeded value; pass that live value in `scale` so an admin's edit in Settings
// takes effect everywhere grades are shown, instead of duplicating these numbers.
export const DEFAULT_GRADING_SCALE: GradeBand[] = [
  { grade: "A1", min: 80, max: 100, remark: "Excellent" },
  { grade: "B2", min: 70, max: 79,  remark: "Very Good" },
  { grade: "B3", min: 60, max: 69,  remark: "Good" },
  { grade: "C4", min: 50, max: 59,  remark: "Credit" },
  { grade: "C5", min: 45, max: 49,  remark: "Credit" },
  { grade: "C6", min: 40, max: 44,  remark: "Credit" },
  { grade: "D7", min: 35, max: 39,  remark: "Pass" },
  { grade: "E8", min: 30, max: 34,  remark: "Pass" },
  { grade: "F9", min: 0,  max: 29,  remark: "Fail" },
];

export function gradeFromScore(score: number, maxScore = 100, scale: GradeBand[] = DEFAULT_GRADING_SCALE): string {
  const pct = (score / maxScore) * 100;
  const band = [...scale].sort((a, b) => b.min - a.min).find((b) => pct >= b.min);
  return band?.grade ?? scale[scale.length - 1]?.grade ?? "F9";
}

export function gradeRemark(grade: string, scale: GradeBand[] = DEFAULT_GRADING_SCALE): string {
  return scale.find((b) => b.grade === grade)?.remark ?? "";
}
