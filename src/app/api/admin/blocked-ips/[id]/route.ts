import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { unblockIP } from "@/lib/services/blocked-ip.service";
import { ok, forbidden, unauthorized, notFound } from "@/lib/http";
import { NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  try {
    const removed = await unblockIP(user, params.id);
    return ok(removed);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Record to delete does not exist")) return notFound();
    return NextResponse.json({ error: "Failed to unblock IP" }, { status: 500 });
  }
}
