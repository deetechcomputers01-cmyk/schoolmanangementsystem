-- CreateTable
CREATE TABLE "MealServing" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "servedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "servedById" TEXT NOT NULL,
    CONSTRAINT "MealServing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealServing_menuId_studentId_key" ON "MealServing"("menuId", "studentId");

-- AddForeignKey
ALTER TABLE "MealServing" ADD CONSTRAINT "MealServing_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "MealMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealServing" ADD CONSTRAINT "MealServing_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MealServing" ADD CONSTRAINT "MealServing_servedById_fkey" FOREIGN KEY ("servedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
