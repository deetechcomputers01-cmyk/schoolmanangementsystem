import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "@/lib/auth/rbac";
import { audit } from "./audit.service";

const examInclude = {
  subject:   { select: { id: true, name: true, code: true } },
  class:     { select: { id: true, name: true, level: true } },
  term:      { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count:    { select: { scores: true } }
} as const;

// ── List / Get ────────────────────────────────────────────────────────────────

export async function listExams(filters?: { classId?: string; subjectId?: string; termId?: string }) {
  return prisma.exam.findMany({
    where: {
      ...(filters?.classId   && { classId:   filters.classId }),
      ...(filters?.subjectId && { subjectId: filters.subjectId }),
      ...(filters?.termId    && { termId:    filters.termId })
    },
    include: examInclude,
    orderBy: { scheduledAt: "desc" }
  });
}

export async function getExam(id: string) {
  return prisma.exam.findUniqueOrThrow({
    where: { id },
    include: {
      ...examInclude,
      class: {
        include: {
          students: {
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: { id: true, firstName: true, lastName: true, admissionNo: true }
          }
        }
      },
      scores: { select: { studentId: true, score: true, remarks: true } }
    }
  });
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createExam(
  actor: SessionUser,
  data: {
    title: string; subjectId: string; classId: string;
    termId?: string; scheduledAt: string; maxScore: number;
  }
) {
  assertCan(actor, "grades:write");
  const exam = await prisma.exam.create({
    data: {
      title:       data.title,
      subjectId:   data.subjectId,
      classId:     data.classId,
      termId:      data.termId ?? null,
      scheduledAt: new Date(data.scheduledAt),
      maxScore:    data.maxScore,
      createdById: actor.id
    },
    include: examInclude
  });
  await audit(actor, "create_exam", "Exam", exam.id, { title: exam.title });
  return exam;
}

// ── Score entry (upsert bulk) ─────────────────────────────────────────────────

export async function submitScores(
  actor: SessionUser,
  examId: string,
  scores: Array<{ studentId: string; score: number; remarks?: string }>
) {
  assertCan(actor, "grades:write");

  const exam = await prisma.exam.findUniqueOrThrow({ where: { id: examId } });

  // Validate no score exceeds maxScore
  for (const s of scores) {
    if (s.score > exam.maxScore) {
      throw new Error(`Score ${s.score} exceeds max score ${exam.maxScore}`);
    }
  }

  await prisma.$transaction(
    scores.map((s) =>
      prisma.examScore.upsert({
        where:  { examId_studentId: { examId, studentId: s.studentId } },
        create: { examId, studentId: s.studentId, score: s.score, remarks: s.remarks },
        update: { score: s.score, remarks: s.remarks }
      })
    )
  );

  await audit(actor, "submit_scores", "Exam", examId, { count: scores.length });
  return { saved: scores.length };
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteExam(actor: SessionUser, id: string) {
  assertCan(actor, "grades:write");
  const exam = await prisma.exam.findUniqueOrThrow({ where: { id } });
  await prisma.exam.delete({ where: { id } });
  await audit(actor, "delete_exam", "Exam", id, { title: exam.title });
  return exam;
}

// ── Report card data ──────────────────────────────────────────────────────────

export async function getReportCardData(studentId: string, termName?: string) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      class: { include: { subjects: { include: { staff: { select: { firstName: true, lastName: true } } } } } },
      guardians: { select: { name: true, phone: true, relation: true } }
    }
  });

  // Resolve active term if not specified
  const activeTerm = termName
    ? await prisma.term.findFirst({ where: { name: termName }, include: { academicYear: true } })
    : await prisma.term.findFirst({ where: { isCurrent: true }, include: { academicYear: true } });

  const resolvedTermName = activeTerm?.name ?? termName ?? "Term 1";

  // Fetch grades (class/CA scores) for this student and term
  const grades = await prisma.grade.findMany({
    where:   { studentId, term: resolvedTermName },
    include: { subject: { select: { id: true, name: true } } }
  });

  // Fetch exam scores for exams in this class + term
  const examScores = await prisma.examScore.findMany({
    where: {
      studentId,
      exam: {
        classId: student.classId,
        ...(activeTerm ? { termId: activeTerm.id } : {})
      }
    },
    include: {
      exam: { include: { subject: { select: { id: true, name: true } } } }
    }
  });

  // Attendance summary for the term date range
  const attendanceFilter =
    activeTerm
      ? { studentId, date: { gte: activeTerm.startDate, lte: activeTerm.endDate } }
      : { studentId };

  const attendance = await prisma.attendance.groupBy({
    by:    ["status"],
    where: attendanceFilter,
    _count: { status: true }
  });

  return { student, activeTerm, grades, examScores, attendance };
}
