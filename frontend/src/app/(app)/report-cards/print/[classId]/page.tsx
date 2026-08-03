import { notFound, redirect } from "next/navigation";
import { prisma } from "@backend/prisma";
import { getCurrentUser } from "@backend/auth/cookies";
import { ReportCardBody } from "../../[studentId]/ReportCardBody";
import { getStudentReportCardData } from "../../getStudentReportCardData";
import { PrintTrigger } from "../PrintTrigger";

export const dynamic = "force-dynamic";

export default async function PrintClassReportCardsPage({ params }: { params: { classId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["super_admin", "principal", "teacher", "staff", "admin"].includes(user.role)) redirect("/dashboard");

  const students = await prisma.student.findMany({
    where: params.classId === "all" ? undefined : { classId: params.classId },
    orderBy: [{ class: { name: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
    select: { id: true },
  });
  if (students.length === 0) notFound();

  const cards = await Promise.all(students.map((s) => getStudentReportCardData(s.id)));

  return (
    <div style={{ background: "#fff", padding: 24 }}>
      <PrintTrigger />
      {cards.map((data, i) => data && (
        <div key={students[i].id} style={{ pageBreakAfter: i < cards.length - 1 ? "always" : "auto", marginBottom: 24 }}>
          <ReportCardBody {...data} />
        </div>
      ))}
      <style>{`
        @media print {
          body { background: white !important; }
          .report-card { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
