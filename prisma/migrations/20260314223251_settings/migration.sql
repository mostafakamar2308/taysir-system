/*
  Warnings:

  - You are about to drop the column `phone` on the `Tutor` table. All the data in the column will be lost.
  - Added the required column `maxStudents` to the `Academy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxTutors` to the `Academy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryColor` to the `Academy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Academy" ADD COLUMN     "maxStudents" INTEGER NOT NULL,
ADD COLUMN     "maxTutors" INTEGER NOT NULL,
ADD COLUMN     "primaryColor" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tutor" DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT 'ar';
