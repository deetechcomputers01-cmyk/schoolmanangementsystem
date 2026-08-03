import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Clear everything in dependency order ──────────────────────────────────
  await prisma.visitorLog.deleteMany();
  await prisma.studentTransport.deleteMany();
  await prisma.transportRoute.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.bookCheckout.deleteMany();
  await prisma.book.deleteMany();
  await prisma.sickVisit.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.staffSalary.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.schoolSettings.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.blockedIP.deleteMany();
  await prisma.term.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.examScore.deleteMany();
  await prisma.exam.deleteMany();
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

  // ── Staff & admin users ───────────────────────────────────────────────────
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
  const driverUser   = await prisma.user.create({ data: { name: "Kweku Mensah",  email: "driver@scholarsphere.edu.gh",   passwordHash, role: "staff" } });
  const catererUser  = await prisma.user.create({ data: { name: "Abena Osei",    email: "caterer@scholarsphere.edu.gh",  passwordHash, role: "staff" } });
  const nurseUser    = await prisma.user.create({ data: { name: "Akua Frimpong", email: "nurse@scholarsphere.edu.gh",    passwordHash, role: "staff" } });
  const securityUser = await prisma.user.create({ data: { name: "Kofi Boateng",  email: "security@scholarsphere.edu.gh", passwordHash, role: "staff" } });

  // ── Student & guardian users ──────────────────────────────────────────────
  // Student 1: Akosua Asare (Basic 6, boarder, top student)
  const akosuaUser = await prisma.user.create({
    data: { name: "Akosua Asare", email: "akosua.asare@scholarsphere.edu.gh", passwordHash, role: "student" }
  });
  const akosuaGuardianUser = await prisma.user.create({
    data: { name: "Mrs. Abena Asare", email: "aba.asare@scholarsphere.edu.gh", passwordHash, role: "guardian" }
  });

  // Student 2: Kofi Antwi (JHS 1, day student, average, some issues)
  const kofiUser = await prisma.user.create({
    data: { name: "Kofi Antwi", email: "kofi.antwi@scholarsphere.edu.gh", passwordHash, role: "student" }
  });
  const kofiGuardianUser = await prisma.user.create({
    data: { name: "Mr. Kwabena Antwi", email: "kwabena.antwi@scholarsphere.edu.gh", passwordHash, role: "guardian" }
  });

  // ── Classes ───────────────────────────────────────────────────────────────
  const [basicSix, jhsOne] = await Promise.all([
    prisma.class.create({ data: { name: "Basic 6", level: "Upper Primary" } }),
    prisma.class.create({ data: { name: "JHS 1",   level: "Junior High"   } })
  ]);

  // ── Teaching staff ────────────────────────────────────────────────────────
  const [staffA, staffB] = await Promise.all([
    prisma.staff.create({ data: { staffNo: "STF-001", firstName: "Kwame", lastName: "Owusu",   phone: "0244001001", roleTitle: "Mathematics Teacher", isTeaching: true,  staffCategory: "teaching", userId: teacherAUser.id } }),
    prisma.staff.create({ data: { staffNo: "STF-002", firstName: "Efua",  lastName: "Boateng", phone: "0207002002", roleTitle: "English Teacher",      isTeaching: true,  staffCategory: "teaching", userId: teacherBUser.id } })
  ]);

  // ── Non-teaching staff ────────────────────────────────────────────────────
  const staffAccounts = await prisma.staff.create({ data: { staffNo: "STF-003", firstName: "Yaw",   lastName: "Adjei",    phone: "0553003003", roleTitle: "Accounts Officer",  isTeaching: false, staffCategory: "accounts",  userId: staffUser.id   } });
  const staffDriver   = await prisma.staff.create({ data: { staffNo: "STF-004", firstName: "Kweku", lastName: "Mensah",   phone: "0244004004", roleTitle: "School Bus Driver", isTeaching: false, staffCategory: "driver",    userId: driverUser.id  } });
  const staffCaterer  = await prisma.staff.create({ data: { staffNo: "STF-005", firstName: "Abena", lastName: "Osei",     phone: "0207005005", roleTitle: "Head Caterer",      isTeaching: false, staffCategory: "caterer",   userId: catererUser.id } });
  const staffNurse    = await prisma.staff.create({ data: { staffNo: "STF-006", firstName: "Akua",  lastName: "Frimpong", phone: "0553006006", roleTitle: "School Nurse",      isTeaching: false, staffCategory: "nurse",     userId: nurseUser.id   } });
  const staffSecurity = await prisma.staff.create({ data: { staffNo: "STF-007", firstName: "Kofi",  lastName: "Boateng",  phone: "0244007007", roleTitle: "Security Officer",  isTeaching: false, staffCategory: "security",  userId: securityUser.id} });
  void staffAccounts; void staffCaterer;

  // ── Payroll: Salary + Payslips ─────────────────────────────────────────────
  const teachingStaff = [staffA, staffB];
  const nonTeachingStaff = [staffDriver, staffNurse, staffSecurity];
  const months = ["2026-04", "2026-05", "2026-06"];

  for (const s of teachingStaff) {
    const sal = await prisma.staffSalary.create({
      data: { staffId: s.id, basicSalary: 3000, allowances: 500, deductions: 200, effectiveFrom: new Date("2025-09-01") }
    });
    for (const [i, month] of months.entries()) {
      await prisma.payslip.create({
        data: { staffId: s.id, salaryId: sal.id, month, basicSalary: 3000, allowances: 500, deductions: 200, netPay: 3300, status: i < 2 ? "paid" : "approved", paidAt: i < 2 ? new Date(`${month}-28`) : null }
      });
    }
  }
  for (const s of nonTeachingStaff) {
    const sal = await prisma.staffSalary.create({
      data: { staffId: s.id, basicSalary: 1800, allowances: 200, deductions: 100, effectiveFrom: new Date("2025-09-01") }
    });
    for (const [i, month] of months.entries()) {
      await prisma.payslip.create({
        data: { staffId: s.id, salaryId: sal.id, month, basicSalary: 1800, allowances: 200, deductions: 100, netPay: 1900, status: i < 2 ? "paid" : "draft", paidAt: i < 2 ? new Date(`${month}-28`) : null }
      });
    }
  }

  // ── Subjects ──────────────────────────────────────────────────────────────
  const [math, english, science, social] = await Promise.all([
    prisma.subject.create({ data: { name: "Mathematics",       code: "MATH-B6", classId: basicSix.id, staffId: staffA.id } }),
    prisma.subject.create({ data: { name: "English Language",  code: "ENG-B6",  classId: basicSix.id, staffId: staffB.id } }),
    prisma.subject.create({ data: { name: "Integrated Science",code: "SCI-J1",  classId: jhsOne.id,   staffId: staffA.id } }),
    prisma.subject.create({ data: { name: "Social Studies",    code: "SOC-J1",  classId: jhsOne.id,   staffId: staffB.id } })
  ]);

  // Timetable slots are created manually by staff — not seeded

  // ── Academic Calendar ─────────────────────────────────────────────────────
  const academicYear = await prisma.academicYear.create({
    data: {
      name: "2025/2026", startDate: new Date("2025-09-01"), endDate: new Date("2026-07-31"), isCurrent: true,
      terms: {
        create: [
          { name: "Term 1", startDate: new Date("2025-09-01"), endDate: new Date("2025-12-13"), isCurrent: false },
          { name: "Term 2", startDate: new Date("2026-01-12"), endDate: new Date("2026-04-04"), isCurrent: false },
          { name: "Term 3", startDate: new Date("2026-04-27"), endDate: new Date("2026-07-25"), isCurrent: true  }
        ]
      }
    }
  });
  const term3 = await prisma.term.findFirst({ where: { isCurrent: true } });

  // ── School Settings ───────────────────────────────────────────────────────
  await prisma.schoolSettings.create({
    data: {
      id: "singleton", name: "ScholarSphere Academy",
      address: "P.O. Box 1234, East Legon, Accra, Ghana",
      motto: "Knowledge, Integrity, Excellence",
      phone: "+233 20 000 0000", email: "info@scholarsphere.edu.gh",
      reportFooter: "This report is official and computer-generated. ScholarSphere Academy | BECE Centre No: SS-001",
      timezone: "Africa/Accra",
      gradingScale: [
        { grade: "A1", min: 80, max: 100, remark: "Excellent"    },
        { grade: "B2", min: 70, max: 79,  remark: "Very Good"    },
        { grade: "B3", min: 60, max: 69,  remark: "Good"         },
        { grade: "C4", min: 50, max: 59,  remark: "Credit"       },
        { grade: "C5", min: 45, max: 49,  remark: "Credit"       },
        { grade: "C6", min: 40, max: 44,  remark: "Credit"       },
        { grade: "D7", min: 35, max: 39,  remark: "Pass"         },
        { grade: "E8", min: 30, max: 34,  remark: "Pass"         },
        { grade: "F9", min: 0,  max: 29,  remark: "Fail"         }
      ]
    }
  });

  // Announcements are created manually by admin — not seeded

  // ── Transport ─────────────────────────────────────────────────────────────
  const [busA, busB] = await Promise.all([
    prisma.vehicle.create({ data: { regNo: "GR-1234-24", make: "Toyota Coaster",   capacity: 30, type: "bus",     driverId: staffDriver.id } }),
    prisma.vehicle.create({ data: { regNo: "GR-5678-22", make: "Hyundai Minibus",  capacity: 18, type: "minibus", driverId: staffDriver.id } })
  ]);
  const [routeA, routeB] = await Promise.all([
    prisma.transportRoute.create({ data: { name: "East Legon Route", vehicleId: busA.id, stops: ["American House", "Trasacco Valley", "Roman Ridge", "Shiashie", "School Gate"], morningPickup: "06:15", afternoonDrop: "15:45" } }),
    prisma.transportRoute.create({ data: { name: "Adenta Route",     vehicleId: busB.id, stops: ["Adenta Barrier", "Frafraha", "Oyibi Junction", "School Gate"],               morningPickup: "06:00", afternoonDrop: "16:00" } })
  ]);

  // ── Library Books ─────────────────────────────────────────────────────────
  const [mathBook, engBook] = await Promise.all([
    prisma.book.create({ data: { title: "Mathematics for Basic 6",         author: "Ghana Education Service", category: "Mathematics", quantity: 10, available: 8, shelfLocation: "Block A, Shelf 1" } }),
    prisma.book.create({ data: { title: "English Language Textbook JHS 1", author: "GES Publications",        category: "Literature",  quantity: 8,  available: 7, shelfLocation: "Block A, Shelf 2" } })
  ]);
  await Promise.all([
    prisma.book.create({ data: { title: "Integrated Science JHS 1",            author: "GES Publications", category: "Science",     quantity: 6, available: 5, shelfLocation: "Block B, Shelf 1" } }),
    prisma.book.create({ data: { title: "Our Day History",                      author: "Kwame Asare",      category: "History",     quantity: 4, available: 4, shelfLocation: "Block B, Shelf 2" } }),
    prisma.book.create({ data: { title: "Story Time: Anansi and the Pot of Wisdom", author: "Efua Sutherland", category: "Fiction", quantity: 5, available: 4, shelfLocation: "Block C, Shelf 1" } })
  ]);
  void engBook;

  // ── Visitor Log ───────────────────────────────────────────────────────────
  const visitorData = [
    { visitorName: "Mr. Charles Asare",    phone: "0244111222", purpose: "Parent-Teacher Meeting", hostName: "Kwame Owusu",   entryTime: new Date("2026-07-01T09:15:00"), exitTime: new Date("2026-07-01T10:30:00"), badgeNo: "VB-001" },
    { visitorName: "GES District Officer", phone: "0302000001", purpose: "School Inspection",      hostName: "Dr. Ama Mensah", entryTime: new Date("2026-07-02T10:00:00"), exitTime: new Date("2026-07-02T13:00:00"), badgeNo: "VB-002" },
    { visitorName: "Abena Kyei",           phone: "0244556677", purpose: "Admission Enquiry",      hostName: "Administration", entryTime: new Date("2026-07-02T11:30:00"), exitTime: new Date("2026-07-02T12:00:00"), badgeNo: "VB-003" },
    { visitorName: "UNICEF Field Officer", phone: null,          purpose: "Health Programme Review",hostName: "Akua Frimpong", entryTime: new Date("2026-07-03T09:00:00"), exitTime: new Date("2026-07-03T11:45:00"), badgeNo: "VB-004" }
  ];
  for (const v of visitorData) {
    await prisma.visitorLog.create({ data: { ...v, gateStaffId: staffSecurity.id } });
  }

  // ── Meal Menu ─────────────────────────────────────────────────────────────
  const weekOf = "2026-06-30";
  const mealPlan = [
    { day: "Monday",    mealType: "Breakfast", items: ["Hausa Koko", "Koose", "Milo"] },
    { day: "Monday",    mealType: "Lunch",     items: ["Jollof Rice", "Fried Chicken", "Coleslaw", "Juice"] },
    { day: "Monday",    mealType: "Dinner",    items: ["Fufu", "Light Soup", "Boiled Egg"] },
    { day: "Tuesday",   mealType: "Breakfast", items: ["Bread", "Egg Stew", "Ovaltine"] },
    { day: "Tuesday",   mealType: "Lunch",     items: ["Rice & Beans", "Palava Sauce", "Fried Plantain"] },
    { day: "Tuesday",   mealType: "Dinner",    items: ["Banku", "Okra Stew", "Tilapia"] },
    { day: "Wednesday", mealType: "Breakfast", items: ["Porridge", "Fried Eggs", "Tea"] },
    { day: "Wednesday", mealType: "Lunch",     items: ["Ampesi", "Garden Egg Stew", "Fish"] },
    { day: "Wednesday", mealType: "Dinner",    items: ["Tom Brown", "Boiled Egg", "Milo"] },
    { day: "Thursday",  mealType: "Breakfast", items: ["Oats", "Milk", "Bread"] },
    { day: "Thursday",  mealType: "Lunch",     items: ["Fried Rice", "Chicken", "Salad"] },
    { day: "Thursday",  mealType: "Dinner",    items: ["Konkonte", "Groundnut Soup", "Smoked Fish"] },
    { day: "Friday",    mealType: "Breakfast", items: ["Waakye", "Spaghetti", "Boiled Egg", "Pepper Sauce"] },
    { day: "Friday",    mealType: "Lunch",     items: ["Kenkey", "Fried Fish", "Pepper Sauce", "Salad"] },
    { day: "Friday",    mealType: "Dinner",    items: ["Leftover Rice", "Stew", "Water"] }
  ];
  for (const entry of mealPlan) {
    await prisma.mealMenu.upsert({
      where: { weekOf_day_mealType: { weekOf, day: entry.day, mealType: entry.mealType } },
      update: { items: entry.items },
      create: { weekOf, ...entry }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── STUDENT 1: Akosua Asare — Basic 6, Boarder, Top Student ──────────────
  // ─────────────────────────────────────────────────────────────────────────
  const akosua = await prisma.student.create({
    data: {
      admissionNo: "ADM-2026-001", firstName: "Akosua", lastName: "Asare",
      gender: "Female", dateOfBirth: new Date("2013-04-10"), address: "East Legon, Accra",
      classId: basicSix.id, userId: akosuaUser.id,
      boardingType: "boarder", boardingHouse: "Eban House", boardingRoom: "Room 3A",
      guardians: {
        create: { name: "Mrs. Abena Asare", phone: "+233 24 500 0001", email: "aba.asare@scholarsphere.edu.gh", relation: "Mother", userId: akosuaGuardianUser.id }
      }
    }
  });

  // Attendance — last 10 school days (Jun 23–Jul 4, 2026)
  const akosuaAttendance = [
    { date: "2026-06-23", status: "present" as const },
    { date: "2026-06-24", status: "present" as const },
    { date: "2026-06-25", status: "present" as const },
    { date: "2026-06-26", status: "present" as const },
    { date: "2026-06-27", status: "late"    as const, note: "Arrived 15 min late due to transport delay" },
    { date: "2026-06-30", status: "present" as const },
    { date: "2026-07-01", status: "present" as const },
    { date: "2026-07-02", status: "present" as const },
    { date: "2026-07-03", status: "present" as const },
    { date: "2026-07-04", status: "present" as const }
  ];
  for (const a of akosuaAttendance) {
    await prisma.attendance.create({ data: { studentId: akosua.id, classId: basicSix.id, date: new Date(a.date), status: a.status, note: a.note ?? null } });
  }

  // Grades — 3 terms, Math + English
  const akosuaGrades = [
    { subjectId: math.id,    term: "Term 1", score: 85, remarks: "Very good performance" },
    { subjectId: english.id, term: "Term 1", score: 78, remarks: "Good effort"           },
    { subjectId: math.id,    term: "Term 2", score: 88, remarks: "Excellent progress"    },
    { subjectId: english.id, term: "Term 2", score: 82, remarks: "Improving steadily"    },
    { subjectId: math.id,    term: "Term 3", score: 91, remarks: "Outstanding"           },
    { subjectId: english.id, term: "Term 3", score: 87, remarks: "Very good"             }
  ];
  for (const g of akosuaGrades) {
    await prisma.grade.create({ data: { studentId: akosua.id, ...g } });
  }

  // Fees — 3 terms
  const fee1A = await prisma.feeRecord.create({ data: { studentId: akosua.id, term: "Term 1", description: "Tuition, PTA levy, and boarding fees", amountDue: 950, status: "paid" } });
  await prisma.payment.create({ data: { feeRecordId: fee1A.id, amount: 950, method: "mobile_money", reference: "MM-ADM2026001-T1", paidAt: new Date("2025-09-03") } });
  const fee2A = await prisma.feeRecord.create({ data: { studentId: akosua.id, term: "Term 2", description: "Tuition, PTA levy, and boarding fees", amountDue: 950, status: "paid" } });
  await prisma.payment.create({ data: { feeRecordId: fee2A.id, amount: 950, method: "bank_transfer", reference: "BT-ADM2026001-T2", paidAt: new Date("2026-01-13") } });
  const fee3A = await prisma.feeRecord.create({ data: { studentId: akosua.id, term: "Term 3", description: "Tuition, PTA levy, and boarding fees", amountDue: 950, status: "partial" } });
  await prisma.payment.create({ data: { feeRecordId: fee3A.id, amount: 600, method: "mobile_money", reference: "MM-ADM2026001-T3A", paidAt: new Date("2026-05-01") } });

  // Health record
  const hrAkosua = await prisma.healthRecord.create({
    data: { studentId: akosua.id, bloodGroup: "A+", allergies: "Peanuts", conditions: null, emergencyContact: "Mrs. Abena Asare", emergencyPhone: "+233 24 500 0001" }
  });
  await prisma.sickVisit.create({ data: { healthRecordId: hrAkosua.id, date: new Date("2026-06-25T09:15:00"), complaint: "Headache", treatment: "Paracetamol 500mg. Resting in ward.", notes: "Temperature 37.4°C. Given paracetamol and advised to rest. Parent notified.", status: "completed", triage: "routine", vitalsTemp: "37.4", vitalsBp: "110/70" } });
  await prisma.sickVisit.create({ data: { healthRecordId: hrAkosua.id, date: new Date("2026-07-01T10:00:00"), complaint: "Routine allergy check", treatment: "Antihistamine administered", notes: "Routine review for peanut allergy. No active symptoms. Epi-pen available.", status: "completed", triage: "scheduled", vitalsTemp: "36.8", vitalsBp: "108/68" } });
  await prisma.vaccination.create({ data: { healthRecordId: hrAkosua.id, vaccineName: "Yellow Fever", date: new Date("2025-09-01"), nextDue: new Date("2035-09-01"), notes: "GHS standard vaccination administered on school entry day" } });
  await prisma.vaccination.create({ data: { healthRecordId: hrAkosua.id, vaccineName: "COVID-19 (Booster)", date: new Date("2026-01-15"), nextDue: null, notes: "Pfizer-BioNTech booster dose" } });

  // Exams are created manually by admin/teachers — not seeded

  // Library checkout
  await prisma.bookCheckout.create({ data: { bookId: mathBook.id, studentId: akosua.id, checkedOutAt: new Date("2026-06-30"), dueDate: new Date("2026-07-20"), returnedAt: null } });

  // Transport
  await prisma.studentTransport.create({ data: { studentId: akosua.id, routeId: routeA.id } });

  // ─────────────────────────────────────────────────────────────────────────
  // ── STUDENT 2: Kofi Antwi — JHS 1, Day Student, Average ──────────────────
  // ─────────────────────────────────────────────────────────────────────────
  const kofi = await prisma.student.create({
    data: {
      admissionNo: "ADM-2026-002", firstName: "Kofi", lastName: "Antwi",
      gender: "Male", dateOfBirth: new Date("2012-08-22"), address: "Adenta, Accra",
      classId: jhsOne.id, userId: kofiUser.id,
      boardingType: "day", boardingHouse: null, boardingRoom: null,
      guardians: {
        create: { name: "Mr. Kwabena Antwi", phone: "+233 20 300 4455", email: "kwabena.antwi@scholarsphere.edu.gh", relation: "Father", userId: kofiGuardianUser.id }
      }
    }
  });

  // Attendance — last 10 school days
  const kofiAttendance = [
    { date: "2026-06-23", status: "present" as const },
    { date: "2026-06-24", status: "present" as const },
    { date: "2026-06-25", status: "present" as const },
    { date: "2026-06-26", status: "absent"  as const, note: "Reported sick — parent called in" },
    { date: "2026-06-27", status: "present" as const },
    { date: "2026-06-30", status: "late"    as const, note: "Arrived 30 minutes late" },
    { date: "2026-07-01", status: "present" as const },
    { date: "2026-07-02", status: "present" as const },
    { date: "2026-07-03", status: "present" as const },
    { date: "2026-07-04", status: "present" as const }
  ];
  for (const a of kofiAttendance) {
    await prisma.attendance.create({ data: { studentId: kofi.id, classId: jhsOne.id, date: new Date(a.date), status: a.status, note: a.note ?? null } });
  }

  // Grades — 3 terms, Science + Social Studies
  const kofiGrades = [
    { subjectId: science.id, term: "Term 1", score: 65, remarks: "Below average — needs to revise" },
    { subjectId: social.id,  term: "Term 1", score: 58, remarks: "Struggling with map work"         },
    { subjectId: science.id, term: "Term 2", score: 68, remarks: "Slight improvement"               },
    { subjectId: social.id,  term: "Term 2", score: 62, remarks: "Better engagement in class"       },
    { subjectId: science.id, term: "Term 3", score: 72, remarks: "Good improvement this term"       },
    { subjectId: social.id,  term: "Term 3", score: 70, remarks: "On track"                         }
  ];
  for (const g of kofiGrades) {
    await prisma.grade.create({ data: { studentId: kofi.id, ...g } });
  }

  // Fees — 3 terms (Term 1 paid, Term 2 partial, Term 3 unpaid)
  const fee1K = await prisma.feeRecord.create({ data: { studentId: kofi.id, term: "Term 1", description: "Tuition and PTA levy", amountDue: 850, status: "paid" } });
  await prisma.payment.create({ data: { feeRecordId: fee1K.id, amount: 850, method: "cash", reference: "CASH-ADM2026002-T1", paidAt: new Date("2025-09-05") } });
  const fee2K = await prisma.feeRecord.create({ data: { studentId: kofi.id, term: "Term 2", description: "Tuition and PTA levy", amountDue: 850, status: "partial" } });
  await prisma.payment.create({ data: { feeRecordId: fee2K.id, amount: 400, method: "mobile_money", reference: "MM-ADM2026002-T2A", paidAt: new Date("2026-01-20") } });
  await prisma.feeRecord.create({ data: { studentId: kofi.id, term: "Term 3", description: "Tuition and PTA levy", amountDue: 850, status: "unpaid" } });

  // Health record
  const hrKofi = await prisma.healthRecord.create({
    data: { studentId: kofi.id, bloodGroup: "O+", allergies: null, conditions: "Mild asthma — uses reliever inhaler as needed", emergencyContact: "Mr. Kwabena Antwi", emergencyPhone: "+233 20 300 4455" }
  });
  await prisma.sickVisit.create({ data: { healthRecordId: hrKofi.id, date: new Date("2026-05-15T11:00:00"), complaint: "Asthma — difficulty breathing during sports", treatment: "Salbutamol inhaler administered. Parent called.", notes: "Episode triggered by dust during outdoor activity. Resolved after inhaler. PE exclusion for 1 week recommended.", status: "completed", triage: "urgent", vitalsTemp: "37.1", vitalsBp: "115/72" } });
  await prisma.sickVisit.create({ data: { healthRecordId: hrKofi.id, date: new Date("2026-06-26T08:30:00"), complaint: "Cough and mild fever", treatment: "Paracetamol 500mg. Sent home to rest.", notes: "Temperature 38.1°C. Parent collected student at 10:00 AM.", status: "completed", triage: "routine", vitalsTemp: "38.1", vitalsBp: "112/70" } });
  await prisma.vaccination.create({ data: { healthRecordId: hrKofi.id, vaccineName: "Hepatitis B", date: new Date("2026-01-20"), nextDue: null, notes: "Booster administered at school health day" } });

  // Exams
  const sciMidterm  = await prisma.exam.create({ data: { title: "JHS 1 Mid-Term Integrated Science", subjectId: science.id, classId: jhsOne.id, termId: term3?.id, scheduledAt: new Date("2026-06-07T09:00:00"), maxScore: 100, createdById: superAdmin.id } });
  const socMidterm  = await prisma.exam.create({ data: { title: "JHS 1 Mid-Term Social Studies",    subjectId: social.id,  classId: jhsOne.id, termId: term3?.id, scheduledAt: new Date("2026-06-08T09:00:00"), maxScore: 100, createdById: superAdmin.id } });
  await prisma.examScore.create({ data: { examId: sciMidterm.id, studentId: kofi.id, score: 72, remarks: "Showed improvement from Term 2" } });
  await prisma.examScore.create({ data: { examId: socMidterm.id, studentId: kofi.id, score: 65, remarks: "Needs to work on essay structure" } });
  // Also add Akosua's exam scores (exams were already created above)
  // Add Kofi to Basic 6 exams is not valid — he's JHS 1, OK.

  // Transport
  await prisma.studentTransport.create({ data: { studentId: kofi.id, routeId: routeB.id } });

  // ── Audit Log ─────────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id, action: "seed", entity: "Database", entityId: "seed",
      metadata: { students: 2, roles: ["super_admin","principal","teacher","staff","student","guardian"], academicYear: academicYear.name }
    }
  });

  console.log("\n✅ Seed complete.\n");
  console.log("── Staff logins (all password: Password123!) ─────────────────");
  console.log("  Super Admin  →  superadmin@scholarsphere.edu.gh");
  console.log("  Principal    →  principal@scholarsphere.edu.gh");
  console.log("  Teacher 1    →  teacher1@scholarsphere.edu.gh     (Math, Basic 6 & JHS 1 Science)");
  console.log("  Teacher 2    →  teacher2@scholarsphere.edu.gh     (English, JHS 1 Social Studies)");
  console.log("  Accounts     →  staff@scholarsphere.edu.gh");
  console.log("  Driver       →  driver@scholarsphere.edu.gh");
  console.log("  Caterer      →  caterer@scholarsphere.edu.gh");
  console.log("  Nurse        →  nurse@scholarsphere.edu.gh");
  console.log("  Security     →  security@scholarsphere.edu.gh");
  console.log("\n── Student 1 (Akosua Asare, Basic 6, Boarder) ───────────────");
  console.log("  Student      →  akosua.asare@scholarsphere.edu.gh");
  console.log("  Guardian     →  aba.asare@scholarsphere.edu.gh    (Mrs. Abena Asare)");
  console.log("  Fees:          Term1 ✓ paid  |  Term2 ✓ paid  |  Term3 ~ partial (GHS 600/950)");
  console.log("  Grades:        Math 85→88→91  |  English 78→82→87");
  console.log("  Attendance:    9 present, 1 late (10 days)");
  console.log("  Health:        A+, Peanut allergy, 2 sick visits, 2 vaccinations");
  console.log("  Library:       1 book checked out");
  console.log("\n── Student 2 (Kofi Antwi, JHS 1, Day Student) ──────────────");
  console.log("  Student      →  kofi.antwi@scholarsphere.edu.gh");
  console.log("  Guardian     →  kwabena.antwi@scholarsphere.edu.gh (Mr. Kwabena Antwi)");
  console.log("  Fees:          Term1 ✓ paid  |  Term2 ~ partial (GHS 400/850)  |  Term3 ✗ unpaid");
  console.log("  Grades:        Science 65→68→72  |  Social Studies 58→62→70");
  console.log("  Attendance:    8 present, 1 absent, 1 late (10 days)");
  console.log("  Health:        O+, Mild asthma, 2 sick visits, 1 vaccination");
  console.log("  Discipline:    1 record (Tardiness — Jun 30)");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
