import { notFound, redirect } from "next/navigation";
import { prisma } from "@backend/prisma";
import { getCurrentUser } from "@backend/auth/cookies";
import { StudentReportCardClient } from "./StudentReportCardClient";
import { getStudentReportCardData } from "../getStudentReportCardData";

export const dynamic = "force-dynamic";

export default async function StudentReportCardPage({ params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Students can only view their own report card
  if (user.role === "student") {
    const own = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } });
    if (!own || own.id !== params.studentId) redirect("/dashboard");
  } else if (!["super_admin", "principal", "teacher", "staff", "admin"].includes(user.role)) {
    redirect("/dashboard");
  }

  const data = await getStudentReportCardData(params.studentId);
  if (!data) notFound();

  return <StudentReportCardClient {...data} />;
}
