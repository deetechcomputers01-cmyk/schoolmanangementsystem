import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { createTerm } from "@/lib/services/academic.service";
import { termSchema } from "@/lib/validation/academic";
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
