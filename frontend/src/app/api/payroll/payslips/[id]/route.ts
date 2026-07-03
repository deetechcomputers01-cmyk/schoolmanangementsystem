import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updatePayslipStatus } from "@backend/services/payroll.service";
import { ok, unauthorized } from "@/lib/http";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { status } = await request.json();
  try {
    return ok(await updatePayslipStatus(user, params.id, status));
  } catch (e: unknown) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
