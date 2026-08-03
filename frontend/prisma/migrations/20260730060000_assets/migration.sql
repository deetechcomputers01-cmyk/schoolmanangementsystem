-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('active', 'maintenance', 'disposed', 'low_stock');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'active',
    "location" TEXT,
    "custodianId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "value" DECIMAL(10,2),
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Asset_tag_key" ON "Asset"("tag");

-- CreateTable
CREATE TABLE "AssetMovement" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "actedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetMovement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_custodianId_fkey" FOREIGN KEY ("custodianId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssetMovement" ADD CONSTRAINT "AssetMovement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetMovement" ADD CONSTRAINT "AssetMovement_actedById_fkey" FOREIGN KEY ("actedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
