-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "ApprovalDecision" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "approverRole" TEXT,
    "approverId" TEXT,
    "decision" "ApprovalDecision" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_requestId_order_key" ON "ApprovalStep"("requestId", "order");

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
