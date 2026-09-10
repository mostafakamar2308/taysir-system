-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "supervisorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TutorAttendance" ALTER COLUMN "reviewedBy" DROP NOT NULL;