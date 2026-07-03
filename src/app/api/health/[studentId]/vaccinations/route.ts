import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { addVaccination } from "@/lib/services/health.service";
import { ok, unauthorized } from "@/lib/http";

export async function POST(request: NextRequest, { params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const data = await request.json();
  return ok(await addVaccination(user, params.studentId, data), 201);
}
