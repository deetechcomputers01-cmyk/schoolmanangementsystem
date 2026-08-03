import type { Role } from "@prisma/client";
import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { audit } from "./audit.service";
import { notifyUsers } from "./notification.service";
import { getSettings } from "./settings.service";

async function notifyAnnouncementRecipients(ann: { id: string; title: string; body: string; audience: string[] }) {
  const settings = await getSettings();
  const ex = (settings.extra ?? {}) as Record<string, unknown>;
  if (ex.staffAnnouncements === false) return;

  const users = await prisma.user.findMany({
    where: ann.audience.length > 0 ? { role: { in: ann.audience as Role[] } } : {},
    select: { id: true },
  });
  await notifyUsers(users.map((u) => u.id), {
    type: "staff_announcement",
    title: ann.title,
    body: ann.body.length > 140 ? `${ann.body.slice(0, 140)}…` : ann.body,
    link: "/announcements",
  });
}

const authorSelect = { author: { select: { id: true, name: true, role: true } } } as const;

// ── Queries ────────────────────────────────────────────────────────────────────

export async function listAnnouncements(role?: string) {
  const now = new Date();
  return prisma.announcement.findMany({
    where: {
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      // audience empty = everyone; otherwise filter by role
      ...(role ? { OR: [{ audience: { isEmpty: true } }, { audience: { has: role } }] } : {})
    },
    include: authorSelect,
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }]
  });
}

export async function listAllAnnouncements() {
  return prisma.announcement.findMany({
    include: authorSelect,
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }]
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createAnnouncement(
  actor: SessionUser,
  data: { title: string; body: string; audience: string[]; isPinned: boolean; expiresAt?: Date }
) {
  assertCan(actor, "announcements:write");
  const ann = await prisma.announcement.create({
    data: {
      title:     data.title,
      body:      data.body,
      audience:  data.audience,
      isPinned:  data.isPinned,
      expiresAt: data.expiresAt ?? null,
      authorId:  actor.id
    },
    include: authorSelect
  });
  await audit(actor, "create_announcement", "Announcement", ann.id, { title: ann.title });
  await notifyAnnouncementRecipients(ann);
  return ann;
}

export async function updateAnnouncement(
  actor: SessionUser,
  id: string,
  data: { title?: string; body?: string; audience?: string[]; isPinned?: boolean; expiresAt?: Date | null }
) {
  assertCan(actor, "announcements:write");
  const ann = await prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title     !== undefined && { title:     data.title }),
      ...(data.body      !== undefined && { body:      data.body }),
      ...(data.audience  !== undefined && { audience:  data.audience }),
      ...(data.isPinned  !== undefined && { isPinned:  data.isPinned }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt })
    },
    include: authorSelect
  });
  await audit(actor, "update_announcement", "Announcement", id, { title: ann.title });
  return ann;
}

export async function deleteAnnouncement(actor: SessionUser, id: string) {
  assertCan(actor, "announcements:write");
  const ann = await prisma.announcement.findUniqueOrThrow({ where: { id } });
  await prisma.announcement.delete({ where: { id } });
  await audit(actor, "delete_announcement", "Announcement", id, { title: ann.title });
  return ann;
}
