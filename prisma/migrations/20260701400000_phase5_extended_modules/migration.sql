-- Phase 5: Extended Modules
-- Admissions, Payroll, Disciplinary, Health Records, Library

-- Enums
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'approved', 'rejected', 'enrolled');
CREATE TYPE "PayslipStatus"      AS ENUM ('draft', 'approved', 'paid');

-- ── Admissions ────────────────────────────────────────────────────────────────

CREATE TABLE "AdmissionApplication" (
    "id"               TEXT NOT NULL,
    "firstName"        TEXT NOT NULL,
    "lastName"         TEXT NOT NULL,
    "gender"           TEXT NOT NULL,
    "dateOfBirth"      TIMESTAMP(3) NOT NULL,
    "address"          TEXT NOT NULL,
    "applyingForClass" TEXT NOT NULL,
    "guardianName"     TEXT NOT NULL,
    "guardianPhone"    TEXT NOT NULL,
    "guardianEmail"    TEXT,
    "guardianRelation" TEXT NOT NULL,
    "status"           "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "admissionNo"      TEXT,
    "notes"            TEXT,
    "reviewedById"     TEXT,
    "reviewedAt"       TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Payroll ───────────────────────────────────────────────────────────────────

CREATE TABLE "StaffSalary" (
    "id"            TEXT NOT NULL,
    "staffId"       TEXT NOT NULL,
    "basicSalary"   DECIMAL(10,2) NOT NULL,
    "allowances"    DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductions"    DECIMAL(10,2) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffSalary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffSalary_staffId_key" ON "StaffSalary"("staffId");

ALTER TABLE "StaffSalary" ADD CONSTRAINT "StaffSalary_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Payslip" (
    "id"          TEXT NOT NULL,
    "staffId"     TEXT NOT NULL,
    "salaryId"    TEXT NOT NULL,
    "month"       TEXT NOT NULL,
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances"  DECIMAL(10,2) NOT NULL,
    "deductions"  DECIMAL(10,2) NOT NULL,
    "netPay"      DECIMAL(10,2) NOT NULL,
    "status"      "PayslipStatus" NOT NULL DEFAULT 'draft',
    "paidAt"      TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payslip_staffId_month_key" ON "Payslip"("staffId", "month");

ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_salaryId_fkey"
    FOREIGN KEY ("salaryId") REFERENCES "StaffSalary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Disciplinary ──────────────────────────────────────────────────────────────

CREATE TABLE "DisciplinaryRecord" (
    "id"           TEXT NOT NULL,
    "studentId"    TEXT NOT NULL,
    "category"     TEXT NOT NULL,
    "description"  TEXT NOT NULL,
    "action"       TEXT NOT NULL,
    "date"         TIMESTAMP(3) NOT NULL,
    "reportedById" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisciplinaryRecord_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DisciplinaryRecord" ADD CONSTRAINT "DisciplinaryRecord_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DisciplinaryRecord" ADD CONSTRAINT "DisciplinaryRecord_reportedById_fkey"
    FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Health Records ────────────────────────────────────────────────────────────

CREATE TABLE "HealthRecord" (
    "id"               TEXT NOT NULL,
    "studentId"        TEXT NOT NULL,
    "bloodGroup"       TEXT,
    "allergies"        TEXT,
    "conditions"       TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone"   TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthRecord_studentId_key" ON "HealthRecord"("studentId");

ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SickVisit" (
    "id"             TEXT NOT NULL,
    "healthRecordId" TEXT NOT NULL,
    "date"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "complaint"      TEXT NOT NULL,
    "treatment"      TEXT,
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SickVisit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SickVisit" ADD CONSTRAINT "SickVisit_healthRecordId_fkey"
    FOREIGN KEY ("healthRecordId") REFERENCES "HealthRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Vaccination" (
    "id"             TEXT NOT NULL,
    "healthRecordId" TEXT NOT NULL,
    "vaccineName"    TEXT NOT NULL,
    "date"           TIMESTAMP(3) NOT NULL,
    "nextDue"        TIMESTAMP(3),
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_healthRecordId_fkey"
    FOREIGN KEY ("healthRecordId") REFERENCES "HealthRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Library ───────────────────────────────────────────────────────────────────

CREATE TABLE "Book" (
    "id"        TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "author"    TEXT NOT NULL,
    "isbn"      TEXT,
    "category"  TEXT NOT NULL,
    "quantity"  INTEGER NOT NULL DEFAULT 1,
    "available" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn") WHERE "isbn" IS NOT NULL;

CREATE TABLE "BookCheckout" (
    "id"           TEXT NOT NULL,
    "bookId"       TEXT NOT NULL,
    "studentId"    TEXT NOT NULL,
    "checkedOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate"      TIMESTAMP(3) NOT NULL,
    "returnedAt"   TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookCheckout_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BookCheckout" ADD CONSTRAINT "BookCheckout_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookCheckout" ADD CONSTRAINT "BookCheckout_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
