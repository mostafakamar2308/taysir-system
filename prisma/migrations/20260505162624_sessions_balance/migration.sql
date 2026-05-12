/*
  Warnings:

  - You are about to drop the column `date` on the `Revenue` table. All the data in the column will be lost.
  - You are about to drop the column `recurringPatternId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `RecurringPattern` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `dueDate` on table `Revenue` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "RecurringPattern" DROP CONSTRAINT "RecurringPattern_academyId_fkey";

-- DropForeignKey
ALTER TABLE "RecurringPattern" DROP CONSTRAINT "RecurringPattern_studentId_fkey";

-- DropForeignKey
ALTER TABLE "RecurringPattern" DROP CONSTRAINT "RecurringPattern_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_academyId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_recurringPatternId_fkey";

-- AlterTable
ALTER TABLE "Revenue" DROP COLUMN "date",
ALTER COLUMN "dueDate" SET NOT NULL,
ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "recurringPatternId";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "sessionsBalance" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "RecurringPattern";

-- DropTable
DROP TABLE "Report";
