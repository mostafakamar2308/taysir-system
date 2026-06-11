/*
  Warnings:

  - You are about to drop the `Waitlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "WhatsAppMessage" ADD COLUMN     "leadId" TEXT;

-- DropTable
DROP TABLE "Waitlist";

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "academyName" TEXT NOT NULL,
    "countryCode" TEXT,
    "studentCategory" TEXT,
    "teacherCount" TEXT,
    "currentMethod" TEXT,
    "biggestChallenge" TEXT,
    "urgency" TEXT,
    "qualificationTier" TEXT,
    "qualificationStatus" TEXT,
    "whatsappMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_qualificationTier_idx" ON "Lead"("qualificationTier");

-- CreateIndex
CREATE INDEX "Lead_qualificationStatus_idx" ON "Lead"("qualificationStatus");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_leadId_idx" ON "WhatsAppMessage"("leadId");

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
