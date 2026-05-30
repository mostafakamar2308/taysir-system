/*
  Warnings:

  - You are about to drop the column `email` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `preferredLanguage` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "email",
DROP COLUMN "imageUrl",
DROP COLUMN "name",
DROP COLUMN "phone",
DROP COLUMN "preferredLanguage",
DROP COLUMN "timezone";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "studentId",
ADD COLUMN     "imageUrl" TEXT;
