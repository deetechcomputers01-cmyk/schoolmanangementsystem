import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { setSalary, generatePayslip } from "@/lib/services/payroll.service";
import { ok, forbidden, unauthorized } from "@/lib/http";

export async function POST(request: NextRequest, { params }: { params: { staffId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json();
  try {
    if (body.action === "generate-payslip") {
      return ok(await generatePayslip(user, params.staffId, body.month));
    }
    return ok(await setSalary(user, params.staffId, body));
  } catch (e: unknown) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
