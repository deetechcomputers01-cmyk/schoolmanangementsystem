import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";

export async function listCalendarEvents(year: number, month: number) {
  // month is 0-indexed (JS convention)
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0, 23, 59, 59);
  return prisma.calendarEvent.findMany({
    where: { date: { gte: start, lte: end } },
    include: { createdBy: { select: { name: true } } },
    orderBy: { date: "asc" },
  });
}

export async function createCalendarEvent(
  actor: SessionUser,
  data: {
    title: string;
    description?: string;
    category: string;
    date: string;      // ISO date string "YYYY-MM-DD"
    time?: string;
    endTime?: string;
    location?: string;
    audience?: string;
  }
) {
  return prisma.calendarEvent.create({
    data: {
      title:       data.title,
      description: data.description ?? "",
      category:    data.category,
      date:        new Date(data.date),
      time:        data.time     ?? null,
      endTime:     data.endTime  ?? null,
      location:    data.location ?? null,
      audience:    data.audience ?? null,
      approved:    actor.role === "super_admin" || actor.role === "principal",
      createdById: actor.id,
    },
    include: { createdBy: { select: { name: true } } },
  });
}

export async function deleteCalendarEvent(actor: SessionUser, id: string) {
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) throw new Error("Not found");
  if (event.createdById !== actor.id && actor.role !== "super_admin" && actor.role !== "principal") {
    throw new Error("Forbidden");
  }
  return prisma.calendarEvent.delete({ where: { id } });
}
