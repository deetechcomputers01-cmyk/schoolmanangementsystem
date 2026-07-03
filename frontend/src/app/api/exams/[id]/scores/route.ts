import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { submitScores } from "@backend/services/exam.service";
import { scoreEntrySchema } from "@backend/validation/exams";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal" && user.role !== "teacher") return forbidden();

  const body = await request.json();
  const parsed = scoreEntrySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  try {
    const result = await submitScores(user, params.id, parsed.data.scores);
    return ok(result);
  } catch (e: unknown) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to save scores" }, { status: 500 });
  }
}
