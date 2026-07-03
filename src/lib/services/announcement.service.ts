import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "@/lib/auth/rbac";
import { audit } from "./audit.service";

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
