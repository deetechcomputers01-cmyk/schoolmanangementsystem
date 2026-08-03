import { NextResponse } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getMessagableTeachersForGuardian } from "@backend/services/message.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "guardian") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await getMessagableTeachersForGuardian(user.id);
  return NextResponse.json(result);
}
