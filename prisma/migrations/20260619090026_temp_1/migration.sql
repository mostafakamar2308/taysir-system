/*
  Warnings:

  - You are about to drop the column `tutorAttendanceReason` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `tutorAttendanceStatus` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `currentProgram` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContactName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContactPhone` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "tutorAttendanceReason",
DROP COLUMN "tutorAttendanceStatus";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "currentProgram",
DROP COLUMN "emergencyContactName",
DROP COLUMN "emergencyContactPhone";
