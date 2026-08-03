import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listBackups, createBackup, getBackupStats } from "@backend/services/backup.service";
import { ok, unauthorized, forbidden, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  const { searchParams } = req.nextUrl;

  if (searchParams.get("stats") === "1") {
    const stats = await getBackupStats();
    return ok(stats);
  }

  const filters = {
    status: searchParams.get("status") ?? undefined,
    target: searchParams.get("target") ?? undefined,
  };
  const backups = await listBackups(filters);
  return ok(backups);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.backupType) {
    return badRequest({ message: "name and backupType are required" });
  }

  const record = await createBackup(user, {
    name:       body.name,
    backupType: body.backupType,
    expiresAt:  body.expiresAt ? new Date(body.expiresAt) : undefined,
  });
  return ok(record, 201);
}
