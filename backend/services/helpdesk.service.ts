import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

const db = prisma as any; // new models — types available after prisma generate on restart

function nextTicketNo(): Promise<string> {
  return db.supportTicket
    .count()
    .then((n: number) => `#${String(1000 + n + 1).padStart(4, "0")}`);
}

const includeAll = {
  requester: { select: { id: true, name: true, role: true } },
  assignee:  { select: { id: true, name: true, role: true } },
  messages: {
    include: { from: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

// ── Queries ────────────────────────────────────────────────────────────────────

export async function listTickets(filters?: {
  status?: string;
  priority?: string;
  queue?: string;
  assigneeId?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status)   where.status   = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.queue)    where.queue    = filters.queue;
  if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

  return db.supportTicket.findMany({
    where,
    include: {
      requester: { select: { id: true, name: true, role: true } },
      assignee:  { select: { id: true, name: true, role: true } },
      _count: { select: { messages: true } },
    },
    orderBy: [
      { priority: "asc" },   // urgent first (a < h < m < l)
      { createdAt: "desc" },
    ],
  });
}

export async function getTicket(id: string) {
  return db.supportTicket.findUnique({ where: { id }, include: includeAll });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createTicket(actor: SessionUser, data: {
  subject: string;
  description: string;
  queue: string;
  priority: string;
}) {
  const ticketNo = await nextTicketNo();
  const ticket = await db.supportTicket.create({
    data: {
      ticketNo,
      subject:     data.subject,
      description: data.description,
      queue:       data.queue,
      priority:    data.priority,
      requesterId: actor.id,
    },
    include: includeAll,
  });
  await audit(actor, "create_ticket", "SupportTicket", ticket.id, { ticketNo });
  return ticket;
}

export async function updateTicket(actor: SessionUser, id: string, data: {
  status?:     string;
  priority?:   string;
  assigneeId?: string | null;
}) {
  const ticket = await db.supportTicket.update({
    where: { id },
    data: {
      ...(data.status     !== undefined && { status:     data.status }),
      ...(data.priority   !== undefined && { priority:   data.priority }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
    },
    include: includeAll,
  });
  await audit(actor, "update_ticket", "SupportTicket", id, data);
  return ticket;
}

export async function addTicketMessage(actor: SessionUser, ticketId: string, data: {
  body: string;
  isInternal?: boolean;
}) {
  const msg = await db.ticketMessage.create({
    data: {
      ticketId,
      fromId:     actor.id,
      body:       data.body,
      isInternal: data.isInternal ?? false,
    },
    include: { from: { select: { id: true, name: true, role: true } } },
  });
  // Auto-move ticket to in_progress if it was open
  await db.supportTicket.updateMany({
    where: { id: ticketId, status: "open" },
    data:  { status: "in_progress" },
  });
  return msg;
}

export async function getTicketStats() {
  const [total, byStatus, byPriority, byQueue] = await Promise.all([
    db.supportTicket.count(),
    db.supportTicket.groupBy({ by: ["status"],   _count: { _all: true } }),
    db.supportTicket.groupBy({ by: ["priority"], _count: { _all: true } }),
    db.supportTicket.groupBy({ by: ["queue"],    _count: { _all: true } }),
  ]);
  return { total, byStatus, byPriority, byQueue };
}
