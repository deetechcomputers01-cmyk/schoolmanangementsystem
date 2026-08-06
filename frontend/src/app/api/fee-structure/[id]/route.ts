import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { deleteFeeStructureRow } from "@backend/services/feeStructure.service";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    await deleteFeeStructureRow(user, params.id);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
