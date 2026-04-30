"use server";

import db from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue/whatsappQueue";
import { user } from "@/lib/auth";

export async function sendSingleMessage(phoneNumber: string, message: string) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) {
    throw new Error("غير مصرح");
  }

  const academy = await db.academy.findUnique({
    where: { id: currentUser.academyId },
  });

  if (
    !academy ||
    academy.whatsappConnectionStatus !== "connected" ||
    !academy.whatsappInstanceName
  ) {
    throw new Error("واتساب غير متصل");
  }

  const recipientJid = phoneNumber.includes("@")
    ? phoneNumber
    : `${phoneNumber.replace(/\D/g, "")}@s.whatsapp.net`;

  const log = await db.whatsAppMessage.create({
    data: {
      academyId: academy.id,
      remoteJid: recipientJid,
      type: "text",
      content: message,
      status: "pending",
    },
  });

  const job = await whatsappQueue.add("send-message", {
    academyId: academy.id,
    instanceName: academy.whatsappInstanceName,
    recipientJid,
    message,
    isGroup: false,
    messageLogId: log.id,
  });

  return { success: true, jobId: job.id, logId: log.id };
}
