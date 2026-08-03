import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { StudentExamsClient } from "./StudentExamsClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/dashboard");

  const studentRecord = await prisma.student.findFirst({ where: { userId: user.id } });
  if (!studentRecord) redirect("/dashboard");

  const exams = await prisma.exam.findMany({
    where: { classId: studentRecord.classId },
    orderBy: { scheduledAt: "desc" },
    include: {
      subject: { select: { name: true } },
      questions: { select: { marks: true } },
      attempts: { where: { studentId: studentRecord.id }, select: { id: true, submittedAt: true, score: true } },
    },
  });

  const rows = exams.map((e) => {
    const attempt = e.attempts[0];
    return {
      id:            e.id,
      title:         e.title,
      subjectName:   e.subject.name,
      scheduledAt:   e.scheduledAt.toISOString(),
      duration:      e.duration,
      totalMarks:    e.questions.reduce((sum, q) => sum + q.marks, 0),
      isOnline:      e.isOnline,
      questionCount: e.questions.length,
      attemptStatus: (attempt
        ? (attempt.submittedAt ? "submitted" : "in_progress")
        : "not_started") as "not_started" | "in_progress" | "submitted",
      score: attempt?.score ?? null,
    };
  });

  return <StudentExamsClient exams={rows} studentName={user.name ?? ""} />;
}
