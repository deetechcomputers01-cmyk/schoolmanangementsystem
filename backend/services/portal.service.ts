import { prisma } from "../prisma";
import { getSettings } from "./settings.service";
import type { GradeBand } from "../utils";

async function getGradingScale(): Promise<GradeBand[]> {
  const settings = await getSettings();
  return settings.gradingScale as unknown as GradeBand[];
}

async function getAttendanceThresholds(): Promise<{ minAttendanceRate: number; alertThreshold: number }> {
  const settings = await getSettings();
  const ex = (settings.extra ?? {}) as Record<string, unknown>;
  return {
    minAttendanceRate: Number(ex.minAttendanceRate ?? 75),
    alertThreshold:    Number(ex.alertThreshold    ?? 60),
  };
}

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

  const [portfolio, gradingScale] = await Promise.all([
    fetchStudentData(student.id, student.classId),
    getGradingScale(),
  ]);
  return { student, ...portfolio, gradingScale };
}

// ── Guardian portal ────────────────────────────────────────────────────────────

export async function getGuardianPortalData(userId: string) {
  const guardianRecords = await prisma.guardian.findMany({
    where: { userId },
    include: {
      student: {
        include: {
          class: {
            include: {
              subjects: {
                include: { staff: { select: { id: true, firstName: true, lastName: true, userId: true } } }
              },
              timetable: {
                include: { subject: { select: { name: true } } },
                orderBy: [{ day: "asc" }, { startsAt: "asc" }]
              },
              exams: {
                where: { scheduledAt: { gte: new Date() } },
                include: { subject: { select: { name: true } } },
                orderBy: { scheduledAt: "asc" },
                take: 5
              }
            }
          }
        }
      }
    }
  });

  if (!guardianRecords.length) return null;

  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekOf = monday.toISOString().slice(0, 10);

  const [portfolios, announcements, mealMenus, gradingScale, attendanceThresholds] = await Promise.all([
    Promise.all(guardianRecords.map(g => fetchStudentData(g.studentId, g.student.classId))),
    prisma.announcement.findMany({
      where: {
        AND: [
          { OR: [{ audience: { isEmpty: true } }, { audience: { has: "guardian" } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }
        ]
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 6
    }),
    prisma.mealMenu.findMany({ where: { weekOf }, orderBy: [{ day: "asc" }, { mealType: "asc" }] }),
    getGradingScale(),
    getAttendanceThresholds(),
  ]);

  const children = guardianRecords.map((g, i) => {
    const p = portfolios[i];
    const presentCount = p.attendance.filter(a => a.status === "present").length;
    const attendance   = p.attendance.length ? Math.round((presentCount / p.attendance.length) * 100) : 0;
    const allScores    = [
      ...p.grades.map(gr => Number(gr.score)),
      ...p.examScores.map(es => Number(es.score)),
    ];
    const classAverage = allScores.length
      ? Math.round(allScores.reduce((s, n) => s + n, 0) / allScores.length)
      : 0;
    const totalDue  = p.feeRecords.reduce((s, f) => s + Number(f.amountDue), 0);
    const totalPaid = p.feeRecords.reduce((s, f) => f.payments.reduce((si, py) => si + Number(py.amount), 0) + s, 0);
    const feeBalance = Math.max(totalDue - totalPaid, 0);

    return {
      id:           g.student.id,
      guardianId:   g.id,
      firstName:    g.student.firstName,
      lastName:     g.student.lastName,
      admissionNo:  g.student.admissionNo,
      className:    g.student.class.name,
      classId:      g.student.classId,
      house:        g.student.boardingHouse ?? null,
      attendance,
      classAverage,
      feeBalance,
      timetable:       g.student.class.timetable,
      upcomingExams:   g.student.class.exams,
      subjects:        g.student.class.subjects,
      feeRecords:      p.feeRecords,
      recentGrades:    p.grades,
      recentExamScores: p.examScores,
      activeTerm:      p.activeTerm,
    };
  });

  const firstG = guardianRecords[0];

  return {
    guardian: {
      id:       firstG.id,
      name:     firstG.name,
      relation: firstG.relation,
      phone:    firstG.phone,
      email:    firstG.email,
    },
    children,
    announcements,
    mealMenus,
    weekOf,
    gradingScale,
    attendanceThresholds,
  };
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

  const [recentGrades, upcomingExams, todayAttendance, gradingScale] = await Promise.all([
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
      : Promise.resolve([]),
    getGradingScale(),
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
    subjects:             staffRecord?.subjects ?? [],
    gradingScale,
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

// ── Accountant / Finance hub ──────────────────────────────────────────────────

export async function getAccountantPortalData() {
  const [feeStats, collected, pendingCount, recentPayments, payrollStats, recentPayslips] =
    await Promise.all([
      prisma.feeRecord.aggregate({ _sum: { amountDue: true }, _count: true }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.feeRecord.count({ where: { status: { in: ["unpaid", "partial"] } } }),
      prisma.payment.findMany({
        include: {
          feeRecord: {
            include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } }
          }
        },
        orderBy: { paidAt: "desc" },
        take: 10
      }),
      prisma.payslip.aggregate({ _sum: { netPay: true }, where: { status: "paid" } }),
      prisma.payslip.findMany({
        include: { staff: { select: { firstName: true, lastName: true, staffNo: true } } },
        orderBy: { createdAt: "desc" },
        take: 8
      })
    ]);

  const totalFeesDue   = Number(feeStats._sum.amountDue ?? 0);
  const totalCollected = Number(collected._sum.amount   ?? 0);
  return {
    totalFeesDue,
    totalCollected,
    outstanding:      totalFeesDue - totalCollected,
    pendingCount,
    recentPayments,
    totalPayrollPaid: Number(payrollStats._sum.netPay ?? 0),
    recentPayslips
  };
}

// ── Transport / Driver portal ─────────────────────────────────────────────────

export async function getTransportPortalData(userId: string) {
  const staffRecord = await prisma.staff.findFirst({
    where: { userId },
    select: { id: true, firstName: true, lastName: true, staffNo: true, phone: true }
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { driverId: staffRecord?.id },
    include: { routes: { include: { students: { include: { student: { select: { firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } } } } } } } }
  });

  const allRoutes = vehicles.flatMap((v) => v.routes);
  const totalStudents = allRoutes.reduce((sum, r) => sum + r.students.length, 0);

  return { staffRecord, vehicles, allRoutes, totalStudents };
}

// ── Canteen / Caterer portal ──────────────────────────────────────────────────

export async function getCanteenPortalData() {
  const today   = new Date();
  const monday  = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekOf  = monday.toISOString().slice(0, 10);

  const [currentWeekMenus, studentCount] = await Promise.all([
    prisma.mealMenu.findMany({
      where: { weekOf },
      orderBy: [{ day: "asc" }, { mealType: "asc" }]
    }),
    prisma.student.count()
  ]);

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const mealTypes = ["Breakfast","Lunch","Dinner"];

  const menuGrid = days.map((day) => ({
    day,
    meals: mealTypes.map((mealType) => ({
      mealType,
      items: currentWeekMenus.find((m) => m.day === day && m.mealType === mealType)?.items ?? []
    }))
  }));

  return { weekOf, menuGrid, currentWeekMenus, studentCount, today: today.toISOString().slice(0, 10) };
}

// ── Health Clinic / Nurse portal ──────────────────────────────────────────────

export async function getHealthClinicPortalData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [recentVisits, vaccinations, healthRecordCount, studentCount] = await Promise.all([
    prisma.sickVisit.findMany({
      where: { date: { gte: today } },
      include: {
        healthRecord: {
          select: { bloodGroup: true, allergies: true, student: { select: { firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } } } }
        }
      },
      orderBy: { date: "desc" }
    }),
    prisma.vaccination.findMany({
      where: { date: { gte: today } },
      include: {
        healthRecord: {
          select: { student: { select: { firstName: true, lastName: true, admissionNo: true } } }
        }
      },
      orderBy: { date: "desc" }
    }),
    prisma.healthRecord.count(),
    prisma.student.count()
  ]);

  const recentSickVisits = await prisma.sickVisit.findMany({
    include: {
      healthRecord: {
        select: { student: { select: { firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } } } }
      }
    },
    orderBy: { date: "desc" },
    take: 10
  });

  return { todayVisits: recentVisits, todayVaccinations: vaccinations, healthRecordCount, studentCount, recentSickVisits };
}

// ── Security / Gate portal ─────────────────────────────────────────────────────

export async function getSecurityPortalData(userId: string) {
  const staffRecord = await prisma.staff.findFirst({
    where: { userId },
    select: { id: true, firstName: true, lastName: true }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayLogs, recentLogs, openCount, totalToday] = await Promise.all([
    prisma.visitorLog.findMany({
      where: { entryTime: { gte: today } },
      orderBy: { entryTime: "desc" }
    }),
    prisma.visitorLog.findMany({
      orderBy: { entryTime: "desc" },
      take: 20
    }),
    prisma.visitorLog.count({ where: { entryTime: { gte: today }, exitTime: null } }),
    prisma.visitorLog.count({ where: { entryTime: { gte: today } } })
  ]);

  return { staffRecord, todayLogs, recentLogs, openCount, totalToday };
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
