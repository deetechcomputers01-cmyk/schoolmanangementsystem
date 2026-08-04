import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { requireRole } from "@backend/auth/page-guard";
import { prisma } from "@backend/prisma";
import { SystemHealthContent } from "./SystemHealthContent";
import { MobileSystemHealthContent } from "@/screens/mobile/MobileSystemHealthContent/MobileSystemHealthContent";

export const dynamic = "force-dynamic";

async function checkStorageWritable(): Promise<{ ok: boolean; latencyMs: number }> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const probeFile = path.join(uploadDir, ".health-check");
  const start = Date.now();
  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(probeFile, "ok");
    await unlink(probeFile);
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export async function SystemHealthScreen() {
  await requireRole("super_admin");
  const requestStart = Date.now();

  const now       = new Date();
  const since24h  = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since1h   = new Date(now.getTime() - 60 * 60 * 1000);

  // Measure DB ping latency
  const pingStart = Date.now();
  const [
    userCount,
    studentCount,
    staffCount,
    examCount,
    attendanceCount,
    auditCount24h,
    loginSuccess24h,
    loginFailed24h,
    activeUsers1h,
    recentLogs,
    storage,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.staff.count(),
    prisma.exam.count(),
    prisma.attendance.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: since24h } } }),
    prisma.auditLog.count({ where: { action: "login_success", createdAt: { gte: since24h } } }),
    prisma.auditLog.count({ where: { action: "login_failed", createdAt: { gte: since24h } } }),
    prisma.auditLog.groupBy({ by: ["userId"], where: { createdAt: { gte: since1h } } }).then((r) => r.length),
    prisma.auditLog.findMany({
      take: 24,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, role: true } } },
    }),
    checkStorageWritable(),
  ]);
  const dbLatencyMs = Date.now() - pingStart;
  const failedLogins24h = loginFailed24h;
  const loginAttempts24h = loginSuccess24h + loginFailed24h;

  // A real dev fallback secret in JWT_ACCESS_SECRET/JWT_REFRESH_SECRET means
  // sessions are signed with a value checked into source — a real vulnerability
  // in production, not a cosmetic one.
  const usingDevJwtSecret = !process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET;

  const logs = recentLogs.map((l) => ({
    id:        l.id,
    action:    l.action,
    entity:    l.entity,
    entityId:  l.entityId,
    userName:  l.user?.name ?? "System",
    userRole:  l.user?.role ?? "system",
    createdAt: l.createdAt.toISOString(),
  }));

  const apiGatewayLatencyMs = Date.now() - requestStart;

  const metrics = {
    dbLatencyMs,
    dbStatus:    dbLatencyMs < 500 ? ("healthy" as const) : ("degraded" as const),
    storageWritable: storage.ok,
    storageLatencyMs: storage.latencyMs,
    usingDevJwtSecret,
    loginAttempts24h,
    loginSuccess24h,
    apiGatewayLatencyMs,
    userCount,
    studentCount,
    staffCount,
    examCount,
    attendanceCount,
    auditCount24h,
    failedLogins24h,
    activeUsers1h,
    totalRecords: userCount + studentCount + staffCount + examCount + attendanceCount,
    checkedAt:   now.toISOString(),
  };

  return (
    <>
      <div className="mobileOnly">
        <MobileSystemHealthContent metrics={metrics} logs={logs} />
      </div>
      <div className="desktopOnly">
        <SystemHealthContent metrics={metrics} logs={logs} />
      </div>
    </>
  );
}
