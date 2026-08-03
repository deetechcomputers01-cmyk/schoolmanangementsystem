-- Add Student.status for promotion/graduation tracking
CREATE TYPE "StudentStatus" AS ENUM ('active', 'graduated', 'withdrawn');
ALTER TABLE "Student" ADD COLUMN "status" "StudentStatus" NOT NULL DEFAULT 'active';
