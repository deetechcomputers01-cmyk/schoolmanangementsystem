import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

const DEFAULT_GRADING_SCALE = [
  { grade: "A1", min: 80, max: 100, remark: "Excellent" },
  { grade: "B2", min: 70, max: 79,  remark: "Very Good" },
  { grade: "B3", min: 60, max: 69,  remark: "Good" },
  { grade: "C4", min: 50, max: 59,  remark: "Credit" },
  { grade: "C5", min: 45, max: 49,  remark: "Credit" },
  { grade: "C6", min: 40, max: 44,  remark: "Credit" },
  { grade: "D7", min: 35, max: 39,  remark: "Pass" },
  { grade: "E8", min: 30, max: 34,  remark: "Pass" },
  { grade: "F9", min: 0,  max: 29,  remark: "Fail" }
];

export async function getSettings() {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: "singleton" } });
  if (settings) return settings;
  // Auto-create defaults on first access
  return prisma.schoolSettings.create({
    data: { id: "singleton", gradingScale: DEFAULT_GRADING_SCALE }
  });
}

export async function updateSettings(
  actor: SessionUser,
  data: {
    name?: string; address?: string; motto?: string;
    phone?: string; email?: string; logoUrl?: string;
    reportFooter?: string; timezone?: string;
  }
) {
  if (actor.role !== "super_admin") throw new Error("Forbidden");
  const settings = await prisma.schoolSettings.upsert({
    where:  { id: "singleton" },
    create: { id: "singleton", ...data, gradingScale: DEFAULT_GRADING_SCALE },
    update: data
  });
  await audit(actor, "update_settings", "SchoolSettings", "singleton", data);
  return settings;
}
