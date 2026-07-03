import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listCheckouts, checkoutBook } from "@backend/services/library.service";
import { ok, badRequest, unauthorized } from "@/lib/http";
import { z } from "zod";

const schema = z.object({
  bookId: z.string().cuid(), studentId: z.string().cuid(), dueDate: z.string().datetime()
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const active = new URL(request.url).searchParams.get("active") === "true";
  return ok(await listCheckouts(active));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);
  try { return ok(await checkoutBook(user, parsed.data), 201); }
  catch (e: unknown) { return ok({ error: (e as Error).message }, 400 as number); }
}
