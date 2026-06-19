/*
  Warnings:

  - You are about to drop the column `studentId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `SessionReport` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerHour` on the `Tutor` table. All the data in the column will be lost.
  - You are about to drop the `Attendance` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[participantId]` on the table `SessionReport` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `participantId` to the `SessionReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `privatePricePerHour` to the `Tutor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_studentId_fkey";

-- DropForeignKey
ALTER TABLE "SessionReport" DROP CONSTRAINT "SessionReport_sessionId_fkey";

-- DropIndex
DROP INDEX "Session_studentId_idx";

-- DropIndex
DROP INDEX "SessionReport_sessionId_idx";

-- DropIndex
DROP INDEX "SessionReport_sessionId_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "studentId",
ADD COLUMN     "tutorAttendanceReason" TEXT,
ADD COLUMN     "tutorAttendanceStatus" INTEGER;

-- AlterTable
ALTER TABLE "SessionReport" DROP COLUMN "sessionId",
ADD COLUMN     "participantId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Tutor" DROP COLUMN "pricePerHour",
ADD COLUMN     "groupPricePerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "privatePricePerHour" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "Attendance";

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "studentAttendanceStatus" INTEGER,
    "reason" TEXT,
    "balanceDeducted" BOOLEAN NOT NULL DEFAULT false,
    "cancelledBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_idx" ON "SessionParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "SessionParticipant_studentId_idx" ON "SessionParticipant"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_sessionId_studentId_key" ON "SessionParticipant"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionReport_participantId_key" ON "SessionReport"("participantId");

-- CreateIndex
CREATE INDEX "SessionReport_participantId_idx" ON "SessionReport"("participantId");

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReport" ADD CONSTRAINT "SessionReport_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SessionParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
