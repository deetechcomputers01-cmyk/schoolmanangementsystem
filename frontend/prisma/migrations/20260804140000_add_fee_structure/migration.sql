-- Fee Structure: standard per-class/term/category fee amounts, set in
-- Settings, used to prefill real invoices instead of every invoice being
-- typed from scratch with no reference value.

CREATE TABLE "FeeStructure" (
    "id"        TEXT NOT NULL,
    "classId"   TEXT NOT NULL,
    "term"      TEXT NOT NULL,
    "category"  TEXT NOT NULL,
    "amount"    DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeeStructure_classId_term_category_key" ON "FeeStructure"("classId", "term", "category");

ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
