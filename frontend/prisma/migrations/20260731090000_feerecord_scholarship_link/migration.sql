-- Link a FeeRecord to the Scholarship that discounted it, so the UI can show
-- "covered by scholarship" instead of just a bare discount number, and so a
-- revoked scholarship can find and reverse exactly the fee records it touched.
ALTER TABLE "FeeRecord" ADD COLUMN "scholarshipId" TEXT;
ALTER TABLE "FeeRecord" ADD CONSTRAINT "FeeRecord_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
