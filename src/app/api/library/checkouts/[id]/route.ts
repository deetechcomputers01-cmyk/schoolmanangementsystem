import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { returnBook } from "@/lib/services/library.service";
import { ok, unauthorized } from "@/lib/http";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try { return ok(await returnBook(user, params.id)); }
  catch (e: unknown) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
