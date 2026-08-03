-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "documents" JSONB,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "photoUrl" TEXT;
