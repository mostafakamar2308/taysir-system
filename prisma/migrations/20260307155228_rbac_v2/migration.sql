-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_tutorId_fkey";

-- DropIndex
DROP INDEX "Student_academyId_key";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "tutorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
