/*
  Warnings:

  - A unique constraint covering the columns `[whatsappInstanceName]` on the table `Academy` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Academy" ADD COLUMN     "whatsappConnectedAt" TIMESTAMP(3),
ADD COLUMN     "whatsappConnectionStatus" TEXT DEFAULT 'disconnected',
ADD COLUMN     "whatsappDisconnectedAt" TIMESTAMP(3),
ADD COLUMN     "whatsappInstanceName" TEXT,
ADD COLUMN     "whatsappInstanceToken" TEXT,
ADD COLUMN     "whatsappWebhookUrl" TEXT;

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "academyId" INTEGER NOT NULL,
    "messageId" TEXT,
    "remoteJid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppMessage_academyId_idx" ON "WhatsAppMessage"("academyId");

-- CreateIndex
CREATE UNIQUE INDEX "Academy_whatsappInstanceName_key" ON "Academy"("whatsappInstanceName");

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
