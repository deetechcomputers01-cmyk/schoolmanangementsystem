import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ExamTakingClient } from "./ExamTakingClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/dashboard");

  const studentRecord = await prisma.student.findFirst({ where: { userId: user.id } });
  if (!studentRecord) redirect("/student/exams");

  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: { subject: { select: { name: true } }, class: { select: { name: true } } },
  });
  if (!exam) redirect("/student/exams");

  if (!exam.isOnline || exam.classId !== studentRecord.classId) {
    redirect("/student/exams");
  }

  const questions = await prisma.examQuestion.findMany({
    where: { examId: params.id },
    orderBy: { order: "asc" },
  });

  // Check existing attempt
  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: params.id, studentId: studentRecord.id } },
    select: { id: true, submittedAt: true, score: true },
  });

  const existingAnswers: Record<string, string> = {};
  if (attempt) {
    const savedAnswers = await prisma.studentAnswer.findMany({
      where: { attemptId: attempt.id },
      select: { questionId: true, answer: true },
    });
    for (const a of savedAnswers) {
      existingAnswers[a.questionId] = a.answer ?? "";
    }
  }

  return (
    <ExamTakingClient
      exam={{
        id: exam.id,
        title: exam.title,
        subjectName: exam.subject.name,
        className: exam.class.name,
        duration: exam.duration,
        maxScore: exam.maxScore,
        questions: questions.map((q) => ({
          id: q.id,
          order: q.order,
          text: q.text,
          type: q.type,
          options: (q.options as string[] | null) ?? null,
          marks: Number(q.marks),
        })),
      }}
      attemptId={attempt?.id ?? null}
      alreadySubmitted={!!attempt?.submittedAt}
      submittedScore={attempt?.score ?? null}
      existingAnswers={existingAnswers}
    />
  );
}
