-- Make BackupRecord.initiatedBy nullable and SET NULL on delete instead of
-- RESTRICT, so a full-database restore (which deletes and recreates every
-- User row) doesn't get blocked by backup-history metadata referencing them.
ALTER TABLE "BackupRecord" DROP CONSTRAINT "BackupRecord_initiatedBy_fkey";
ALTER TABLE "BackupRecord" ALTER COLUMN "initiatedBy" DROP NOT NULL;
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
