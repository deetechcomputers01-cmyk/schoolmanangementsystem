import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listDisciplinaryRecords, createDisciplinaryRecord } from "@backend/services/disciplinary.service";
import { ok, badRequest, unauthorized } from "@/lib/http";
import { z } from "zod";

const schema = z.object({
  studentId: z.string().cuid(), category: z.string().min(1),
  description: z.string().min(1), action: z.string().min(1),
  date: z.string().datetime()
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const studentId = new URL(request.url).searchParams.get("studentId") ?? undefined;
  return ok(await listDisciplinaryRecords(studentId));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);
  try { return ok(await createDisciplinaryRecord(user, parsed.data), 201); }
  catch (e: unknown) { return ok({ error: (e as Error).message }, 403 as number); }
}
