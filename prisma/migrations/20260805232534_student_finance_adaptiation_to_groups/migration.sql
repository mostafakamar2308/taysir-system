/*
  Warnings:

  - You are about to drop the column `sessionsPerWeek` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `Revenue` table. All the data in the column will be lost.
  - You are about to drop the column `balanceDeducted` on the `SessionParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `currentSubscriptionId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `planId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `sessionsBalance` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sessionCount` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Revenue" DROP CONSTRAINT "Revenue_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_planId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_academyId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_studentId_fkey";

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "studentSessionPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "GroupStudent" ADD COLUMN     "customSessionPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "sessionsPerWeek",
ADD COLUMN     "sessionCount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Revenue" DROP COLUMN "subscriptionId";

-- AlterTable
ALTER TABLE "SessionParticipant" DROP COLUMN "balanceDeducted",
ADD COLUMN     "paymentStatus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "currentSubscriptionId",
DROP COLUMN "planId",
DROP COLUMN "sessionsBalance",
ADD COLUMN     "creditBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Subscription";
