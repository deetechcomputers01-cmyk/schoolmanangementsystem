import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listExpenses, createExpense } from "@backend/services/expense.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const expenses = await listExpenses();
    return ok(expenses);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const { category, description, amount, vendor, date } = body;
  if (!category || !description || typeof amount !== "number" || !date) {
    return badRequest({ message: ["category, description, amount, and date are required"] });
  }

  try {
    const expense = await createExpense(user, { category, description, amount, vendor, date });
    return ok(expense, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
