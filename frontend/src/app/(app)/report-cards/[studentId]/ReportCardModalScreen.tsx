import { notFound, redirect } from "next/navigation";
import { prisma } from "@backend/prisma";
import { getCurrentUser } from "@backend/auth/cookies";
import { getStudentReportCardData } from "../getStudentReportCardData";
import { ReportCardModalContent } from "./ReportCardModalContent";
import { MobileReportCardDetailContent } from "@/screens/mobile/MobileReportCardDetailContent/MobileReportCardDetailContent";

export const dynamic = "force-dynamic";

/** Shared by both the intercepted modal route and could be reused by the
 *  plain page — same permission check as the existing full-page route. */
export async function ReportCardModalScreen({ studentId }: { studentId: string }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "student") {
    const own = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } });
    if (!own || own.id !== studentId) redirect("/dashboard");
  } else if (!["super_admin", "principal", "teacher", "staff", "admin"].includes(user.role)) {
    redirect("/dashboard");
  }

  const data = await getStudentReportCardData(studentId);
  if (!data) notFound();

  return (
    <>
      <div className="mobileOnly">
        <MobileReportCardDetailContent {...data} />
      </div>
      <div className="desktopOnly">
        <ReportCardModalContent {...data} />
      </div>
    </>
  );
}
