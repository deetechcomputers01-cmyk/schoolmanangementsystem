import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import { audit } from "./audit.service";
import { notifyUsers } from "./notification.service";
import { getSettings } from "./settings.service";

async function notifyExamResults(examId: string, examTitle: string, studentIds: string[]) {
  if (studentIds.length === 0) return;
  const settings = await getSettings();
  const ex = (settings.extra ?? {}) as Record<string, unknown>;
  if (ex.examResultNotifications === false) return;

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: {
      firstName: true, userId: true,
      guardians: { where: { userId: { not: null } }, select: { userId: true } },
    },
  });
  await Promise.all(
    students.map((s) => {
      const recipients = [...(s.userId ? [s.userId] : []), ...s.guardians.map((g) => g.userId!)].filter(Boolean);
      return notifyUsers(recipients, {
        type: "exam_result",
        title: `Result published: ${examTitle}`,
        body: `${s.firstName}'s result for "${examTitle}" is now available.`,
        link: "/report-cards",
      });
    })
  );
}

const examInclude = {
  subject:   { select: { id: true, name: true, code: true } },
  class:     { select: { id: true, name: true, level: true } },
  term:      { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count:    { select: { scores: true } }
} as const;

// ── List / Get ────────────────────────────────────────────────────────────────

export async function listExams(filters?: { classId?: string; subjectId?: string; termId?: string }) {
  const exams = await prisma.exam.findMany({
    where: {
      classId: filters?.classId,
      subjectId: filters?.subjectId,
      termId: filters?.termId,
    },
    include: {
      subject: { select: { name: true, code: true } },
      class: { select: { name: true, level: true } },
      term: { select: { name: true } },
      questions: { select: { marks: true } },
      _count: { select: { scores: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return exams.map((e) => ({
    id: e.id,
    title: e.title,
    subjectId: e.subjectId,
    subjectName: e.subject.name,
    subjectCode: e.subject.code,
    classId: e.classId,
    className: e.class.name,
    classLevel: e.class.level,
    termId: e.termId,
    termName: e.term?.name ?? null,
    scheduledAt: e.scheduledAt,
    maxScore: e.maxScore,
    isOnline: e.isOnline,
    duration: e.duration,
    createdById: e.createdById,
    scoresCount: e._count.scores,
    questionTotalMarks: e.questions.reduce((sum, q) => sum + q.marks, 0),
  }));
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
    termId?: string | null; scheduledAt: string; maxScore: number;
    isOnline?: boolean | null; duration?: number | null;
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
      isOnline:    data.isOnline ?? false,
      duration:    data.duration ?? null,
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

  const existing = await prisma.examScore.findMany({
    where: { examId, studentId: { in: scores.map((s) => s.studentId) } },
    select: { studentId: true },
  });
  const alreadyScored = new Set(existing.map((e) => e.studentId));

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

  // Only notify for newly-scored students — avoids re-notifying on every re-save.
  const newlyScored = scores.filter((s) => !alreadyScored.has(s.studentId)).map((s) => s.studentId);
  notifyExamResults(examId, exam.title, newlyScored).catch(() => {});

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
