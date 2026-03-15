/*
  Warnings:

  - Added the required column `academyId` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "academyId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
