import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";

export async function audit(user: SessionUser | null, action: string, entity: string, entityId: string, metadata?: unknown) {
  await prisma.auditLog.create({
    data: {
      userId: user?.id,
      action,
      entity,
      entityId,
      metadata: metadata === undefined ? undefined : (metadata as object)
    }
  });
}
