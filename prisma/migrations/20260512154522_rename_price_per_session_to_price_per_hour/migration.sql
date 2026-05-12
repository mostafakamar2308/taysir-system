/*
  Warnings:

  - You are about to drop the column `pricePerSession` on the `Tutor` table. All the data in the column will be lost.
  - Added the required column `pricePerHour` to the `Tutor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tutor" RENAME COLUMN "pricePerSession" TO "pricePerHour";
