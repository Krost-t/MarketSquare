-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "category" TEXT,
ADD COLUMN     "osmId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_osmId_key" ON "Shop"("osmId");

