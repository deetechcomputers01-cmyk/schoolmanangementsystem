import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

const db = prisma as any;

const includeSender = { sentBy: { select: { id: true, name: true, role: true } } } as const;

// ── Queries ────────────────────────────────────────────────────────────────────

export async function listBroadcasts(filters?: {
  status?:    string;
  isConsent?: boolean;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status    !== undefined) where.status    = filters.status;
  if (filters?.isConsent !== undefined) where.isConsent = filters.isConsent;

  return db.parentBroadcast.findMany({
    where,
    include: includeSender,
    orderBy: { createdAt: "desc" },
  });
}

export async function getBroadcastStats() {
  const all = await db.parentBroadcast.findMany({ select: { status: true, delivered: true, failed: true, pending: true, isConsent: true } });
  const totalSent    = all.filter((b: any) => b.status !== "draft").length;
  const totalFailed  = all.reduce((s: number, b: any) => s + (b.failed ?? 0), 0);
  const totalPending = all.reduce((s: number, b: any) => s + (b.pending ?? 0), 0);
  const consents     = all.filter((b: any) => b.isConsent).length;

  return { totalSent, totalFailed, totalPending, consents };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createBroadcast(actor: SessionUser, data: {
  subject:     string;
  body:        string;
  audience:    string;
  channels:    string[];
  scheduledAt?: Date;
  isConsent?:  boolean;
}) {
  const isDraft   = false;
  const scheduled = !!data.scheduledAt;

  // Estimate recipient count based on audience
  const audienceCounts: Record<string, number> = {
    all:        1248,
    form1a:     42,
    jhs2:       138,
    defaulters: 87,
    boarding:   213,
    pta:        12,
  };
  const recipientCount = audienceCounts[data.audience] ?? 100;

  const broadcast = await db.parentBroadcast.create({
    data: {
      subject:     data.subject,
      body:        data.body,
      audience:    data.audience,
      channels:    data.channels,
      status:      scheduled ? "scheduled" : "pending",
      scheduledAt: data.scheduledAt ?? null,
      sentAt:      scheduled ? null : new Date(),
      pending:     recipientCount,
      delivered:   0,
      failed:      0,
      isConsent:   data.isConsent ?? false,
      sentById:    actor.id,
    },
    include: includeSender,
  });
  await audit(actor, "send_broadcast", "ParentBroadcast", broadcast.id, { subject: broadcast.subject });

  if (!scheduled) {
    // Simulate delivery after a short delay
    setTimeout(async () => {
      const failed = Math.floor(recipientCount * 0.02);
      await db.parentBroadcast.update({
        where: { id: broadcast.id },
        data:  {
          status:    "delivered",
          delivered: recipientCount - failed,
          failed,
          pending:   0,
        },
      });
    }, 8000);
  }

  return broadcast;
}

export async function updateBroadcast(actor: SessionUser, id: string, data: {
  status?:    string;
  delivered?: number;
  failed?:    number;
  pending?:   number;
}) {
  const broadcast = await db.parentBroadcast.update({
    where: { id },
    data:  {
      ...(data.status    !== undefined && { status:    data.status }),
      ...(data.delivered !== undefined && { delivered: data.delivered }),
      ...(data.failed    !== undefined && { failed:    data.failed }),
      ...(data.pending   !== undefined && { pending:   data.pending }),
    },
    include: includeSender,
  });
  await audit(actor, "update_broadcast", "ParentBroadcast", id, data);
  return broadcast;
}

export async function deleteBroadcast(actor: SessionUser, id: string) {
  const broadcast = await db.parentBroadcast.delete({ where: { id } });
  await audit(actor, "delete_broadcast", "ParentBroadcast", id, { subject: broadcast.subject });
  return broadcast;
}
