/*
  Warnings:

  - You are about to drop the column `tutorId` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `customRate` on the `GroupStudent` table. All the data in the column will be lost.
  - Added the required column `currentTutorId` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tutorId` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tutorRate` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_tutorId_fkey";

-- DropIndex
DROP INDEX "Group_tutorId_idx";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "tutorId",
ADD COLUMN     "currentTutorId" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GroupStudent" DROP COLUMN "customRate";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "tutorId" INTEGER NOT NULL,
ADD COLUMN     "tutorRate" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Tutor" ALTER COLUMN "baseHourlyRate" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "Group_currentTutorId_idx" ON "Group"("currentTutorId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_currentTutorId_fkey" FOREIGN KEY ("currentTutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
