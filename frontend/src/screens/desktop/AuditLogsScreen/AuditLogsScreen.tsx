import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { AuditLogsClient } from "./AuditLogsClient";
import { MobileAuditLogsContent } from "@/screens/mobile/MobileAuditLogsContent/MobileAuditLogsContent";
import styles from "./AuditLogsScreen.module.css";

export const dynamic = "force-dynamic";

export async function AuditLogsScreen() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serialized = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    metadata: l.metadata,
    createdAt: l.createdAt.toISOString(),
    user: l.user ?? null,
  }));

  return (
    <>
      <div className="mobileOnly">
        <MobileAuditLogsContent logs={serialized} />
      </div>
      <div className="desktopOnly">
        <div className={styles.root}>
          <AuditLogsClient logs={serialized} />
        </div>
      </div>
    </>
  );
}
