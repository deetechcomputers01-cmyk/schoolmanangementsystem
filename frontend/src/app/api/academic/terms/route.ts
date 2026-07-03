import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { createTerm } from "@backend/services/academic.service";
import { termSchema } from "@backend/validation/academic";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await request.json();
  const parsed = termSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  const term = await createTerm(user, parsed.data);
  return ok(term, 201);
}
