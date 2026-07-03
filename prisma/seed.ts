import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear everything in dependency order
  await prisma.bookCheckout.deleteMany();
  await prisma.book.deleteMany();
  await prisma.sickVisit.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.disciplinaryRecord.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.staffSalary.deleteMany();
  await prisma.admissionApplication.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.schoolSettings.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.blockedIP.deleteMany();
  await prisma.term.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // ── Users for all 6 roles ──────────────────────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: { name: "System Administrator", email: "superadmin@scholarsphere.edu.gh", passwordHash, role: "super_admin" }
  });

  const principalUser = await prisma.user.create({
    data: { name: "Dr. Ama Mensah", email: "principal@scholarsphere.edu.gh", passwordHash, role: "principal" }
  });

  const teacherAUser = await prisma.user.create({
    data: { name: "Kwame Owusu", email: "teacher1@scholarsphere.edu.gh", passwordHash, role: "teacher" }
  });

  const teacherBUser = await prisma.user.create({
    data: { name: "Efua Boateng", email: "teacher2@scholarsphere.edu.gh", passwordHash, role: "teacher" }
  });

  const staffUser = await prisma.user.create({
    data: { name: "Yaw Adjei", email: "staff@scholarsphere.edu.gh", passwordHash, role: "staff" }
  });

  // Student and guardian users created alongside their records below

  // ── Classes ───────────────────────────────────────────────────────────────
  const [basicSix, jhsOne] = await Promise.all([
    prisma.class.create({ data: { name: "Basic 6", level: "Upper Primary" } }),
    prisma.class.create({ data: { name: "JHS 1", level: "Junior High" } })
  ]);

  // ── Teaching staff ────────────────────────────────────────────────────────
  const [staffA, staffB] = await Promise.all([
    prisma.staff.create({
      data: { staffNo: "STF-001", firstName: "Kwame", lastName: "Owusu", phone: "0244001001", roleTitle: "Mathematics Teacher", isTeaching: true, userId: teacherAUser.id }
    }),
    prisma.staff.create({
      data: { staffNo: "STF-002", firstName: "Efua", lastName: "Boateng", phone: "0207002002", roleTitle: "English Teacher", isTeaching: true, userId: teacherBUser.id }
    })
  ]);

  // ── Non-teaching staff ────────────────────────────────────────────────────
  await prisma.staff.create({
    data: { staffNo: "STF-003", firstName: "Yaw", lastName: "Adjei", phone: "0553003003", roleTitle: "Accounts Officer", isTeaching: false, userId: staffUser.id }
  });

  // ── Subjects ──────────────────────────────────────────────────────────────
  const [math, english, science, social] = await Promise.all([
    prisma.subject.create({ data: { name: "Mathematics", code: "MATH-B6", classId: basicSix.id, staffId: staffA.id } }),
    prisma.subject.create({ data: { name: "English Language", code: "ENG-B6", classId: basicSix.id, staffId: staffB.id } }),
    prisma.subject.create({ data: { name: "Integrated Science", code: "SCI-J1", classId: jhsOne.id, staffId: staffA.id } }),
    prisma.subject.create({ data: { name: "Social Studies", code: "SOC-J1", classId: jhsOne.id, staffId: staffB.id } })
  ]);

  // ── Students with linked user accounts and guardians ─────────────────────
  const studentData = [
    { admissionNo: "ADM-2026-001", firstName: "Akosua",  lastName: "Asare",   gender: "Female", classId: basicSix.id },
    { admissionNo: "ADM-2026-002", firstName: "Kofi",    lastName: "Antwi",   gender: "Male",   classId: basicSix.id },
    { admissionNo: "ADM-2026-003", firstName: "Abena",   lastName: "Darko",   gender: "Female", classId: basicSix.id },
    { admissionNo: "ADM-2026-004", firstName: "Kojo",    lastName: "Sarpong", gender: "Male",   classId: basicSix.id },
    { admissionNo: "ADM-2026-005", firstName: "Adjoa",   lastName: "Nyarko",  gender: "Female", classId: jhsOne.id },
    { admissionNo: "ADM-2026-006", firstName: "Kwesi",   lastName: "Mensah",  gender: "Male",   classId: jhsOne.id },
    { admissionNo: "ADM-2026-007", firstName: "Esi",     lastName: "Ofori",   gender: "Female", classId: jhsOne.id },
    { admissionNo: "ADM-2026-008", firstName: "Yaw",     lastName: "Bempah",  gender: "Male",   classId: jhsOne.id }
  ];

  const students = [];
  let studentUserLinked: string | null = null; // track one student user for seed demo
  let guardianUserLinked: string | null = null;

  for (const [index, s] of studentData.entries()) {
    // First student gets a portal login; first student's guardian gets one too
    let studentUserId: string | undefined;
    let guardianUserId: string | undefined;

    if (index === 0) {
      const sUser = await prisma.user.create({
        data: { name: `${s.firstName} ${s.lastName}`, email: `${s.firstName.toLowerCase()}.student@scholarsphere.edu.gh`, passwordHash, role: "student" }
      });
      const gUser = await prisma.user.create({
        data: { name: `${s.lastName} Guardian`, email: `${s.lastName.toLowerCase()}.guardian@scholarsphere.edu.gh`, passwordHash, role: "guardian" }
      });
      studentUserId = sUser.id;
      guardianUserId = gUser.id;
      studentUserLinked = sUser.email;
      guardianUserLinked = gUser.email;
    }

    const student = await prisma.student.create({
      data: {
        admissionNo: s.admissionNo,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        dateOfBirth: new Date("2013-09-12"),
        address: "East Legon, Accra",
        classId: s.classId,
        userId: studentUserId,
        guardians: {
          create: {
            name: `${s.lastName} Guardian`,
            phone: `024${Math.floor(1000000 + Math.random() * 8999999)}`,
            email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@family.example`,
            relation: "Parent",
            userId: guardianUserId
          }
        }
      }
    });
    students.push(student);
  }

  // ── Attendance, Grades, Fees ──────────────────────────────────────────────
  for (const [i, student] of students.entries()) {
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        classId: student.classId,
        date: new Date("2026-06-17"),
        status: i === 1 ? "late" : i === 5 ? "absent" : "present"
      }
    });

    await prisma.grade.create({
      data: {
        studentId: student.id,
        subjectId: student.classId === basicSix.id ? math.id : science.id,
        term: "Term 3",
        score: 72 + (i % 6) * 3,
        remarks: "Good progress"
      }
    });

    const fee = await prisma.feeRecord.create({
      data: {
        studentId: student.id,
        term: "Term 1",
        description: "Tuition and PTA levy",
        amountDue: 950,
        status: i % 3 === 0 ? "paid" : "partial"
      }
    });

    await prisma.payment.create({
      data: {
        feeRecordId: fee.id,
        amount: i % 3 === 0 ? 950 : 400,
        method: "mobile_money",
        reference: `MM-${student.admissionNo.replaceAll("-", "")}`
      }
    });
  }

  // ── Timetable ─────────────────────────────────────────────────────────────
  const slots = [
    [basicSix.id, math.id,    "Monday",    "08:00", "09:00", "Room B6"],
    [basicSix.id, english.id, "Tuesday",   "09:00", "10:00", "Room B6"],
    [jhsOne.id,   science.id, "Wednesday", "10:30", "11:30", "Science Lab"],
    [jhsOne.id,   social.id,  "Thursday",  "11:30", "12:30", "Room J1"],
    [basicSix.id, math.id,    "Friday",    "08:00", "09:00", "Room B6"]
  ] as const;

  for (const [classId, subjectId, day, startsAt, endsAt, room] of slots) {
    await prisma.timetableSlot.create({ data: { classId, subjectId, day, startsAt, endsAt, room } });
  }

  // ── Academic Calendar ────────────────────────────────────────────────────
  const academicYear = await prisma.academicYear.create({
    data: {
      name:      "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate:   new Date("2026-07-31"),
      isCurrent: true,
      terms: {
        create: [
          {
            name:      "Term 1",
            startDate: new Date("2025-09-01"),
            endDate:   new Date("2025-12-13"),
            isCurrent: false
          },
          {
            name:      "Term 2",
            startDate: new Date("2026-01-12"),
            endDate:   new Date("2026-04-04"),
            isCurrent: false
          },
          {
            name:      "Term 3",
            startDate: new Date("2026-04-27"),
            endDate:   new Date("2026-07-25"),
            isCurrent: true
          }
        ]
      }
    }
  });

  // ── School Settings ───────────────────────────────────────────────────────
  await prisma.schoolSettings.create({
    data: {
      id:           "singleton",
      name:         "ScholarSphere Academy",
      address:      "P.O. Box 1234, East Legon, Accra, Ghana",
      motto:        "Knowledge, Integrity, Excellence",
      phone:        "+233 20 000 0000",
      email:        "info@scholarsphere.edu.gh",
      reportFooter: "This report is official and computer-generated. ScholarSphere Academy | BECE Centre No: SS-001",
      timezone:     "Africa/Accra",
      gradingScale: [
        { grade: "A1", min: 80, max: 100, remark: "Excellent" },
        { grade: "B2", min: 70, max: 79,  remark: "Very Good" },
        { grade: "B3", min: 60, max: 69,  remark: "Good" },
        { grade: "C4", min: 50, max: 59,  remark: "Credit" },
        { grade: "C5", min: 45, max: 49,  remark: "Credit" },
        { grade: "C6", min: 40, max: 44,  remark: "Credit" },
        { grade: "D7", min: 35, max: 39,  remark: "Pass" },
        { grade: "E8", min: 30, max: 34,  remark: "Pass" },
        { grade: "F9", min: 0,  max: 29,  remark: "Fail" }
      ]
    }
  });

  // ── Announcements ──────────────────────────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      {
        title:    "Welcome to Term 3, 2025/2026!",
        body:     "Dear students, parents, and staff — we welcome you to Term 3 of the 2025/2026 academic year. Let us finish strong. Remember: attendance, punctuality, and hard work are the keys to success.",
        audience: [],
        isPinned: true,
        authorId: principalUser.id
      },
      {
        title:    "End-of-Term Examinations Schedule",
        body:     "End-of-term examinations will commence on 14th July 2026. Teachers are advised to complete syllabus coverage by 30th June. Students should collect their exam timetables from their class teachers.",
        audience: ["teacher", "student", "guardian"],
        isPinned: false,
        expiresAt: new Date("2026-07-15"),
        authorId: principalUser.id
      },
      {
        title:    "Staff Meeting — Monday 7th July",
        body:     "All teaching and non-teaching staff are reminded of the mandatory staff meeting scheduled for Monday, 7th July 2026 at 7:30 AM in the staff common room. Attendance is compulsory.",
        audience: ["teacher", "staff"],
        isPinned: false,
        authorId: principalUser.id
      }
    ]
  });

  // ── Phase 5 seed data ────────────────────────────────────────────────────
  // Library books
  await prisma.book.createMany({
    data: [
      { title: "Mathematics for Basic 6", author: "Ghana Education Service", category: "Mathematics", quantity: 10, available: 10 },
      { title: "English Language Textbook JHS 1", author: "GES Publications", category: "Literature", quantity: 8, available: 8 },
      { title: "Integrated Science JHS 1", author: "GES Publications", category: "Science", quantity: 6, available: 6 },
      { title: "Our Day History", author: "Kwame Asare", category: "History", quantity: 4, available: 4 },
      { title: "Story Time: Anansi and the Pot of Wisdom", author: "Efua Sutherland", category: "Fiction", quantity: 5, available: 5 }
    ]
  });

  // Sample admission application
  await prisma.admissionApplication.create({
    data: {
      firstName: "Abena", lastName: "Kyei", gender: "Female",
      dateOfBirth: new Date("2014-03-15"),
      address: "Tema, Greater Accra",
      applyingForClass: "Basic 6",
      guardianName: "Kwesi Kyei", guardianPhone: "0244556677",
      guardianEmail: "kyei@family.example", guardianRelation: "Parent",
      status: "pending"
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: "seed",
      entity: "Database",
      entityId: "seed",
      metadata: {
        students: students.length,
        roles: ["super_admin", "principal", "teacher", "staff", "student", "guardian"],
        academicYear: academicYear.name
      }
    }
  });

  console.log("\n✅ Seed complete. Test accounts (all password: Password123!):\n");
  console.log("  Super Admin  →  superadmin@scholarsphere.edu.gh");
  console.log("  Principal    →  principal@scholarsphere.edu.gh");
  console.log("  Teacher 1    →  teacher1@scholarsphere.edu.gh");
  console.log("  Teacher 2    →  teacher2@scholarsphere.edu.gh");
  console.log("  Staff        →  staff@scholarsphere.edu.gh");
  if (studentUserLinked) console.log(`  Student      →  ${studentUserLinked}`);
  if (guardianUserLinked) console.log(`  Guardian     →  ${guardianUserLinked}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
