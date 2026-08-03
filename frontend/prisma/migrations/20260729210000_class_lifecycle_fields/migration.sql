-- Add real isActive/capacity/room/order columns to Class (replaces fabricated UI-only values)
ALTER TABLE "Class" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Class" ADD COLUMN "capacity" INTEGER;
ALTER TABLE "Class" ADD COLUMN "room" TEXT;
ALTER TABLE "Class" ADD COLUMN "order" INTEGER;
