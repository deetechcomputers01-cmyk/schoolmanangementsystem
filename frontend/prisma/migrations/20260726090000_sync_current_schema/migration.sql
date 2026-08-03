-- DropIndex
DROP INDEX "Guardian_userId_key";

-- AlterTable
ALTER TABLE "AcademicYear" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AdmissionApplication" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "audience" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "shelfLocation" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BookCheckout" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DisciplinaryRecord" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExamScore" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "HealthRecord" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Payslip" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SchoolSettings" ADD COLUMN     "extra" JSONB,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SickVisit" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'waiting',
ADD COLUMN     "triage" TEXT NOT NULL DEFAULT 'routine',
ADD COLUMN     "vitalsBp" TEXT,
ADD COLUMN     "vitalsTemp" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "staffCategory" TEXT NOT NULL DEFAULT 'teaching';

-- AlterTable
ALTER TABLE "StaffSalary" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "boardingHouse" TEXT,
ADD COLUMN     "boardingRoom" TEXT,
ADD COLUMN     "boardingType" TEXT;

-- AlterTable
ALTER TABLE "Term" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TimetableSlot" ADD COLUMN     "effectiveDate" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recurrence" TEXT NOT NULL DEFAULT 'weekly';

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'academic',
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "audience" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'mcq',
    "options" JSONB,
    "correctAnswer" TEXT,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT,
    "isCorrect" BOOLEAN,
    "marksAwarded" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "regNo" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "driverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleId" TEXT,
    "stops" TEXT[],
    "morningPickup" TEXT NOT NULL,
    "afternoonDrop" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTransport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "phone" TEXT,
    "purpose" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "badgeNo" TEXT,
    "gateStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealMenu" (
    "id" TEXT NOT NULL,
    "weekOf" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "items" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "queue" TEXT NOT NULL DEFAULT 'general',
    "requesterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL DEFAULT '',
    "fileSize" TEXT NOT NULL DEFAULT '',
    "fileType" TEXT NOT NULL DEFAULT 'pdf',
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "status" TEXT NOT NULL DEFAULT 'active',
    "ownerId" TEXT NOT NULL,
    "classDept" TEXT,
    "needsSign" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backupType" TEXT NOT NULL DEFAULT 'full',
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "target" TEXT NOT NULL DEFAULT 's3',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "duration" INTEGER,
    "encryption" TEXT NOT NULL DEFAULT 'AES-256',
    "checksum" TEXT,
    "expiresAt" TIMESTAMP(3),
    "initiatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentBroadcast" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "channels" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "pending" INTEGER NOT NULL DEFAULT 0,
    "isConsent" BOOLEAN NOT NULL DEFAULT false,
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "studentId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_examId_studentId_key" ON "ExamAttempt"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAnswer_attemptId_questionId_key" ON "StudentAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_regNo_key" ON "Vehicle"("regNo");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTransport_studentId_routeId_key" ON "StudentTransport"("studentId", "routeId");

-- CreateIndex
CREATE UNIQUE INDEX "MealMenu_weekOf_day_mealType_key" ON "MealMenu"("weekOf", "day", "mealType");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNo_key" ON "SupportTicket"("ticketNo");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_gateStaffId_fkey" FOREIGN KEY ("gateStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolDocument" ADD CONSTRAINT "SchoolDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentBroadcast" ADD CONSTRAINT "ParentBroadcast_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
