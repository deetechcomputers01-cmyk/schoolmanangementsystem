-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('percent', 'fixed');
CREATE TYPE "ScholarshipStatus" AS ENUM ('active', 'expired', 'revoked');

-- AlterTable
ALTER TABLE "FeeRecord" ADD COLUMN "discountApplied" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "ScholarshipType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "academicYearId" TEXT,
    "status" "ScholarshipStatus" NOT NULL DEFAULT 'active',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
