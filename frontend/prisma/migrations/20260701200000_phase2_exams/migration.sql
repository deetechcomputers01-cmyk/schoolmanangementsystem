-- Phase 2, Update 2: Exams & Report Cards

CREATE TABLE "Exam" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "termId"      TEXT,
    "subjectId"   TEXT NOT NULL,
    "classId"     TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "maxScore"    DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdById" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamScore" (
    "id"        TEXT NOT NULL,
    "examId"    TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score"     DOUBLE PRECISION NOT NULL,
    "remarks"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExamScore_examId_studentId_key" ON "ExamScore"("examId", "studentId");

ALTER TABLE "Exam" ADD CONSTRAINT "Exam_termId_fkey"
    FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Exam" ADD CONSTRAINT "Exam_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Exam" ADD CONSTRAINT "Exam_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExamScore" ADD CONSTRAINT "ExamScore_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamScore" ADD CONSTRAINT "ExamScore_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
