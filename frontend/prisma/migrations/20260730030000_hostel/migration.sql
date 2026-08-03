-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Hostel_name_key" ON "Hostel"("name");

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Room_hostelId_name_key" ON "Room"("hostelId", "name");

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelIncident" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "roomId" TEXT,
    "description" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HostelIncident_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HostelIncident" ADD CONSTRAINT "HostelIncident_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HostelIncident" ADD CONSTRAINT "HostelIncident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HostelIncident" ADD CONSTRAINT "HostelIncident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
