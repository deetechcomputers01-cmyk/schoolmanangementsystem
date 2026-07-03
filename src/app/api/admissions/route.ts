import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listApplications, createApplication } from "@backend/services/admission.service";
import { ok, badRequest, unauthorized } from "@/lib/http";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1), lastName: z.string().min(1),
  gender: z.string().min(1), dateOfBirth: z.string().datetime(),
  address: z.string().min(1), applyingForClass: z.string().min(1),
  guardianName: z.string().min(1), guardianPhone: z.string().min(1),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianRelation: z.string().min(1)
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok(await listApplications());
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);
  const app = await createApplication(parsed.data);
  return ok(app, 201);
}
