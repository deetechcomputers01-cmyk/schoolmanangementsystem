-- Phase 2: Academic Terms & Calendar
-- Add AcademicYear and Term tables

CREATE TABLE "AcademicYear" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate"   TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");

CREATE TABLE "Term" (
    "id"             TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "startDate"      TIMESTAMP(3) NOT NULL,
    "endDate"        TIMESTAMP(3) NOT NULL,
    "isCurrent"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Term_academicYearId_name_key" ON "Term"("academicYearId", "name");

ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
