import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getReportCardData } from "@backend/services/exam.service";
import { ok, forbidden, unauthorized, notFound } from "@/lib/http";

export async function GET(request: NextRequest, { params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // Students can only view their own report card
  if (user.role === "student") {
    const { prisma } = await import("@backend/prisma");
    const linked = await prisma.student.findFirst({ where: { userId: user.id } });
    if (!linked || linked.id !== params.studentId) return forbidden();
  }

  const termName = new URL(request.url).searchParams.get("term") ?? undefined;
  try {
    const data = await getReportCardData(params.studentId, termName);
    return ok(data);
  } catch {
    return notFound();
  }
}
