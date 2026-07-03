import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "@/lib/auth/rbac";
import { audit } from "./audit.service";

export async function listBlockedIPs() {
  return prisma.blockedIP.findMany({
    orderBy: { createdAt: "desc" },
    include: { blockedBy: { select: { id: true, name: true, email: true } } }
  });
}

export async function blockIP(
  actor: SessionUser,
  data: { ip: string; reason?: string; expiresAt?: Date }
) {
  assertCan(actor, "admin:blocked-ips:write");

  const blocked = await prisma.blockedIP.upsert({
    where: { ip: data.ip },
    update: { reason: data.reason, expiresAt: data.expiresAt ?? null, blockedById: actor.id },
    create: { ip: data.ip, reason: data.reason, expiresAt: data.expiresAt ?? null, blockedById: actor.id }
  });

  await audit(actor, "block_ip", "BlockedIP", blocked.id, { ip: data.ip, reason: data.reason });
  return blocked;
}

export async function unblockIP(actor: SessionUser, id: string) {
  assertCan(actor, "admin:blocked-ips:write");

  const record = await prisma.blockedIP.findUniqueOrThrow({ where: { id } });
  await prisma.blockedIP.delete({ where: { id } });
  await audit(actor, "unblock_ip", "BlockedIP", id, { ip: record.ip });
  return record;
}

export async function isIPBlocked(ip: string): Promise<boolean> {
  const now = new Date();
  const record = await prisma.blockedIP.findUnique({ where: { ip } });
  if (!record) return false;
  // Treat expired blocks as unblocked (clean them up lazily)
  if (record.expiresAt && record.expiresAt < now) {
    await prisma.blockedIP.delete({ where: { ip } }).catch(() => null);
    return false;
  }
  return true;
}
