import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@backend/prisma";

const ALLOWED = ["super_admin", "principal", "teacher"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; guardianId: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user || !ALLOWED.includes(user.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const guardian = await prisma.guardian.findFirst({
      where: { id: params.guardianId, studentId: params.id },
    });
    if (!guardian) {
      return new Response(JSON.stringify({ error: "Guardian not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { name, relation, phone, email } = await request.json();

    if (!name?.trim() || !relation?.trim() || !phone?.trim()) {
      return new Response(JSON.stringify({ error: "Name, relation, and phone are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updated = await prisma.guardian.update({
      where: { id: params.guardianId },
      data: {
        name: name.trim(),
        relation: relation.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
      },
    });

    return ok({ guardian: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; guardianId: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user || !ALLOWED.includes(user.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const guardian = await prisma.guardian.findFirst({
      where: { id: params.guardianId, studentId: params.id },
    });
    if (!guardian) {
      return new Response(JSON.stringify({ error: "Guardian not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await prisma.guardian.delete({ where: { id: params.guardianId } });
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
