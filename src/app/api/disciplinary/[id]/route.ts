import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { deleteDisciplinaryRecord } from "@backend/services/disciplinary.service";
import { ok, unauthorized } from "@/lib/http";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try { return ok(await deleteDisciplinaryRecord(user, params.id)); }
  catch (e: unknown) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
