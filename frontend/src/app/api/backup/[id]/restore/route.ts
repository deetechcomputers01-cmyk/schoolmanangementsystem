import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { restoreBackup } from "@backend/services/backup.service";
import { ok, fail, unauthorized, forbidden, handleApiError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  try {
    const result = await restoreBackup(user, params.id);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && (error.message.includes("healthy backup") || error.message.includes("checksum") || error.message.includes("missing from disk") || error.message.includes("decrypted"))) {
      return fail(error.message, 400);
    }
    return handleApiError(error);
  }
}
