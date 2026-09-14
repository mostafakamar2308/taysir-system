-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "TutorAttendance" DROP CONSTRAINT "TutorAttendance_reviewedBy_fkey";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "recurringScheduleId" INTEGER;

-- CreateTable
CREATE TABLE "RecurringSchedule" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "tutorId" INTEGER NOT NULL,
    "academyId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "topic" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "endDate" TIMESTAMP(3),
    "skippedDates" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringSchedule_academyId_idx" ON "RecurringSchedule"("academyId");

-- CreateIndex
CREATE INDEX "RecurringSchedule_active_idx" ON "RecurringSchedule"("active");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringSchedule_groupId_dayOfWeek_startTime_key" ON "RecurringSchedule"("groupId", "dayOfWeek", "startTime");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_recurringScheduleId_fkey" FOREIGN KEY ("recurringScheduleId") REFERENCES "RecurringSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSchedule" ADD CONSTRAINT "RecurringSchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSchedule" ADD CONSTRAINT "RecurringSchedule_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSchedule" ADD CONSTRAINT "RecurringSchedule_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorAttendance" ADD CONSTRAINT "TutorAttendance_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "Supervisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
