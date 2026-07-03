import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { reviewApplication, enrollApplication } from "@/lib/services/admission.service";
import { ok, forbidden, unauthorized } from "@/lib/http";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json();
  try {
    if (body.action === "enroll") {
      return ok(await enrollApplication(user, params.id));
    }
    return ok(await reviewApplication(user, params.id, body.status, body.notes));
  } catch (e: unknown) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: e.message === "Forbidden" ? 403 : 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
