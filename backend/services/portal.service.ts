import { prisma } from "../prisma";

async function fetchStudentData(studentId: string, classId: string) {
  const activeTerm = await prisma.term.findFirst({
    where: { isCurrent: true },
    include: { academicYear: true }
  });

  const dateFilter = activeTerm
    ? { gte: activeTerm.startDate, lte: activeTerm.endDate }
    : undefined;

  const [attendance, grades, examScores, feeRecords] = await Promise.all([
    prisma.attendance.findMany({
      where: { studentId, ...(dateFilter ? { date: dateFilter } : {}) },
      orderBy: { date: "desc" },
      take: 30
    }),
    prisma.grade.findMany({
      where: { studentId, ...(activeTerm ? { term: activeTerm.name } : {}) },
      include: { subject: { select: { id: true, name: true } } }
    }),
    prisma.examScore.findMany({
      where: {
        studentId,
        exam: { classId, ...(activeTerm ? { termId: activeTerm.id } : {}) }
      },
      include: { exam: { include: { subject: { select: { id: true, name: true } } } } }
    }),
    prisma.feeRecord.findMany({
      where: { studentId },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return { activeTerm, attendance, grades, examScores, feeRecords };
}

// ── Student portal ────────────────────────────────────────────────────────────

export async function getStudentPortalData(userId: string) {
  const student = await prisma.student.findFirstOrThrow({
    where: { userId },
    include: {
      class: {
        include: {
          subjects: {
            include: { staff: { select: { firstName: true, lastName: true } } }
          },
          timetable: {
            include: { subject: { select: { name: true } } },
            orderBy: [{ day: "asc" }, { startsAt: "asc" }]
          }
        }
      },
      guardians: { select: { name: true, phone: true, relation: true } }
    }
  });

  const portfolio = await fetchStudentData(student.id, student.classId);
  return { student, ...portfolio };
}

// ── Guardian portal ────────────────────────────────────────────────────────────

export async function getGuardianPortalData(userId: string) {
  const guardian = await prisma.guardian.findFirstOrThrow({
    where: { userId },
    include: {
      student: {
        include: {
          class: {
            include: {
              subjects: {
                include: { staff: { select: { firstName: true, lastName: true } } }
              },
              timetable: {
                include: { subject: { select: { name: true } } },
                orderBy: [{ day: "asc" }, { startsAt: "asc" }]
              }
            }
          }
        }
      }
    }
  });

  const portfolio = await fetchStudentData(guardian.studentId, guardian.student.classId);
  return { guardian, student: guardian.student, ...portfolio };
}

// ── Teacher dashboard ──────────────────────────────────────────────────────────

export async function getTeacherDashboardData(userId: string) {
  const staffRecord = await prisma.staff.findFirst({
    where: { userId },
    include: {
      subjects: {
        include: {
          class: {
            include: {
              students: { select: { id: true, firstName: true, lastName: true, admissionNo: true } }
            }
          }
        }
      }
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const classIds = staffRecord?.subjects.map((s) => s.classId) ?? [];

  const [recentGrades, upcomingExams, todayAttendance] = await Promise.all([
    prisma.grade.findMany({
      where: { subject: { staffId: staffRecord?.id } },
      include: {
        student: { select: { firstName: true, lastName: true } },
        subject: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.exam.findMany({
      where: { createdById: userId, scheduledAt: { gte: today } },
      include: {
        subject: { select: { name: true } },
        class:   { select: { name: true } }
      },
      orderBy: { scheduledAt: "asc" },
      take: 5
    }),
    classIds.length > 0
      ? prisma.attendance.groupBy({
          by: ["classId"],
          where: { date: { gte: today }, classId: { in: classIds } },
          _count: { classId: true }
        })
      : Promise.resolve([])
  ]);

  const studentSet = new Set(
    staffRecord?.subjects.flatMap((s) => s.class.students.map((st) => st.id)) ?? []
  );

  return {
    staffRecord,
    subjectCount:         staffRecord?.subjects.length ?? 0,
    studentCount:         studentSet.size,
    recentGrades,
    upcomingExams,
    todayAttendanceCount: todayAttendance.reduce((sum: number, g) => sum + g._count.classId, 0),
    subjects:             staffRecord?.subjects ?? []
  };
}

// ── Staff dashboard ────────────────────────────────────────────────────────────

export async function getStaffDashboardData() {
  const [studentCount, pendingFees, recentPayments] = await Promise.all([
    prisma.student.count(),
    prisma.feeRecord.count({ where: { status: { in: ["unpaid", "partial"] } } }),
    prisma.payment.findMany({
      include: {
        feeRecord: {
          include: { student: { select: { firstName: true, lastName: true } } }
        }
      },
      orderBy: { paidAt: "desc" },
      take: 5
    })
  ]);
  return { studentCount, pendingFees, recentPayments };
}

// ── Super admin extras ────────────────────────────────────────────────────────

export async function getSuperAdminExtras() {
  const [userCount, blockedIPCount, recentAudit] = await Promise.all([
    prisma.user.count(),
    prisma.blockedIP.count(),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);
  return { userCount, blockedIPCount, recentAudit };
}
