import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { setCurrentTerm, updateTerm, deleteTerm } from "@backend/services/academic.service";
import { updateTermSchema } from "@backend/validation/academic";
import { ok, badRequest, forbidden, unauthorized, notFound } from "@/lib/http";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await request.json();

  // { setCurrent: true } → activate this term
  if (body.setCurrent === true) {
    try {
      const term = await setCurrentTerm(user, params.id);
      return ok(term);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("No Term")) return notFound();
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }

  const parsed = updateTermSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  try {
    const term = await updateTerm(user, params.id, parsed.data);
    return ok(term);
  } catch (e: unknown) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  try {
    const term = await deleteTerm(user, params.id);
    return ok(term);
  } catch (e: unknown) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
