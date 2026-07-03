import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateUserRole, toggleUserActive, deleteUser } from "@backend/services/user.service";
import { isIPBlocked } from "@backend/services/blocked-ip.service";
import { updateRoleSchema, toggleActiveSchema } from "@backend/validation/users";
import { ok, badRequest, forbidden, unauthorized, notFound } from "@/lib/http";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await isIPBlocked(ip)) return forbidden();

  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  const body = await request.json();

  // Determine patch type by which key is present
  if ("role" in body) {
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);
    try {
      const updated = await updateUserRole(user, params.id, parsed.data.role);
      return ok(updated);
    } catch (e: unknown) {
      if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }

  if ("isActive" in body) {
    const parsed = toggleActiveSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);
    try {
      const updated = await toggleUserActive(user, params.id, parsed.data.isActive);
      return ok(updated);
    } catch (e: unknown) {
      if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }

  return badRequest({ _: ["Unknown patch operation"] });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await isIPBlocked(ip)) return forbidden();

  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin") return forbidden();

  try {
    const deleted = await deleteUser(user, params.id);
    return ok(deleted);
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message.includes("Record to delete does not exist")) return notFound();
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
