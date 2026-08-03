import { prisma } from "../prisma";
import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";
import { DEFAULT_GRADING_SCALE } from "../utils";

export async function getSettings() {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: "singleton" } });
  if (settings) return settings;
  return prisma.schoolSettings.create({
    data: { id: "singleton", gradingScale: DEFAULT_GRADING_SCALE }
  });
}

export async function updateSettings(
  actor: SessionUser,
  data: {
    name?: string; address?: string; motto?: string;
    phone?: string; email?: string; logoUrl?: string;
    letterheadUrl?: string;
    reportFooter?: string; timezone?: string;
    extra?: Prisma.InputJsonValue;
    gradingScale?: Prisma.InputJsonValue;
  }
) {
  if (actor.role !== "super_admin" && actor.role !== "principal") {
    throw new Error("Forbidden");
  }
  const settings = await prisma.schoolSettings.upsert({
    where:  { id: "singleton" },
    create: { id: "singleton", gradingScale: DEFAULT_GRADING_SCALE, ...data },
    update: data
  });
  await audit(actor, "update_settings", "SchoolSettings", "singleton", data as Record<string, unknown>);
  return settings;
}
