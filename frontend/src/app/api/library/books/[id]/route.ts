import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@backend/auth/cookies";
import { deleteBook, updateBook } from "@backend/services/library.service";
import { ok, badRequest, unauthorized } from "@/lib/http";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional(),
  category: z.string().min(1).optional(),
  shelfLocation: z.string().optional(),
  quantity: z.number().int().positive().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);
  try { return ok(await updateBook(user, params.id, parsed.data)); }
  catch (e: unknown) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try { return ok(await deleteBook(user, params.id)); }
  catch (e: unknown) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
