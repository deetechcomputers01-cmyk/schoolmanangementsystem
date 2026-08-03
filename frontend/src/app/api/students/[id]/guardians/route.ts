import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { createGuardian } from "@backend/services/guardian.service";

const ALLOWED = ["super_admin", "principal", "teacher"];

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !ALLOWED.includes(user.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { name, relation, phone, email, createLogin } = await request.json();

    if (!name?.trim() || !relation?.trim() || !phone?.trim()) {
      return new Response(JSON.stringify({ error: "Name, relation, and phone are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (createLogin && !email?.trim()) {
      return new Response(
        JSON.stringify({ error: "Email is required to create a portal login." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await createGuardian({
      studentId: params.id,
      name: name.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      createLogin: !!createLogin,
    });

    return ok({ guardian: result.guardian, tempPassword: result.tempPassword }, 201);
  } catch (error) {
    if ((error as Error).message === "EMAIL_EXISTS") {
      return new Response(
        JSON.stringify({ error: "A user account with this email already exists." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    return handleApiError(error);
  }
}
