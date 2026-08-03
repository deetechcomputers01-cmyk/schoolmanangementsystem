-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "vendor" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'pending',
    "recordedById" TEXT NOT NULL,
    "approvalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Expense_approvalRequestId_key" ON "Expense"("approvalRequestId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
