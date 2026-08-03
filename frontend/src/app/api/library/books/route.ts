import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listBooks, addBook } from "@backend/services/library.service";
import { ok, badRequest, unauthorized } from "@/lib/http";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1), author: z.string().min(1),
  isbn: z.string().optional(), category: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  shelfLocation: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const category = new URL(request.url).searchParams.get("category") ?? undefined;
  return ok(await listBooks(category));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);
  return ok(await addBook(user, parsed.data), 201);
}
