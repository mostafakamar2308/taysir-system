/*
  Warnings:

  - You are about to drop the column `currencyId` on the `Academy` table. All the data in the column will be lost.
  - Added the required column `academyId` to the `Revenue` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Academy" DROP CONSTRAINT "Academy_currencyId_fkey";

-- AlterTable
ALTER TABLE "Academy" DROP COLUMN "currencyId";

-- AlterTable
ALTER TABLE "Revenue" ADD COLUMN     "academyId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "History_academyId_idx" ON "History"("academyId");

-- AddForeignKey
ALTER TABLE "Academy" ADD CONSTRAINT "Academy_defaultCurrencyId_fkey" FOREIGN KEY ("defaultCurrencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
