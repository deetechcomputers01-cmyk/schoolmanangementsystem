import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok, unauthorized, forbidden, badRequest } from "@/lib/http";
import { createFeeStructureRow, listFeeStructure } from "@backend/services/feeStructure.service";

const READ_ROLES = ["super_admin", "principal", "staff", "accountant"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!READ_ROLES.includes(user.role)) return forbidden();
    return ok(await listFeeStructure());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const amount = Number(body.amount);
    if (!body.classId || !body.term || !body.category || !Number.isFinite(amount) || amount <= 0) {
      return badRequest({ message: "classId, term, category, and a positive amount are required" });
    }
    const row = await createFeeStructureRow(user, {
      classId: body.classId,
      term: String(body.term).trim(),
      category: String(body.category).trim(),
      amount,
    });
    return ok(row, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
