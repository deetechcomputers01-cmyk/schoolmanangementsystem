-- Phase 1: RBAC & Roles
-- Recreate the Role enum with new values, migrate old data inline

-- Step 1: Create the new enum type directly (no ADD VALUE needed)
CREATE TYPE "Role_new" AS ENUM ('super_admin', 'principal', 'teacher', 'staff', 'student', 'guardian');

-- Step 2: Migrate the column, mapping old values to new ones in one shot
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new"
  USING CASE "role"::text
    WHEN 'admin'      THEN 'principal'
    WHEN 'accountant' THEN 'staff'
    WHEN 'parent'     THEN 'guardian'
    ELSE "role"::text
  END::"Role_new";

-- Step 3: Swap enum names
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- Step 4: Add isActive to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Step 5: Add isTeaching flag to Staff
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "isTeaching" BOOLEAN NOT NULL DEFAULT true;

-- Step 6: Add userId to Student (for student portal login)
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "userId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Student_userId_key" ON "Student"("userId");
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: Create BlockedIP table
CREATE TABLE IF NOT EXISTS "BlockedIP" (
    "id"          TEXT NOT NULL,
    "ip"          TEXT NOT NULL,
    "reason"      TEXT,
    "blockedById" TEXT NOT NULL,
    "expiresAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockedIP_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BlockedIP_ip_key" ON "BlockedIP"("ip");
ALTER TABLE "BlockedIP" ADD CONSTRAINT "BlockedIP_blockedById_fkey"
  FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
