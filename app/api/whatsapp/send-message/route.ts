import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue/whatsappQueue";
import { user } from "@/lib/auth";

export async function POST(req: Request) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const academy = await db.academy.findUnique({
    where: { id: currentUser.academyId },
  });

  if (!academy) {
    return NextResponse.json({ error: "Academy not found" }, { status: 400 });
  }

  if (
    academy.whatsappConnectionStatus !== "connected" ||
    !academy.whatsappInstanceName
  ) {
    return NextResponse.json(
      { error: "WhatsApp not connected" },
      { status: 400 },
    );
  }

  const body = await req.json();
  const {
    messages,
  }: {
    messages: Array<{
      phoneNumber: string;
      message: string;
      isGroup?: boolean;
    }>;
  } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Messages array required" },
      { status: 400 },
    );
  }

  const jobs = [];

  for (const item of messages) {
    const recipientJid = item.phoneNumber.includes("@")
      ? item.phoneNumber
      : `${item.phoneNumber.replace(/\D/g, "")}@s.whatsapp.net`;

    // Create log entry matching your schema
    const log = await db.whatsAppMessage.create({
      data: {
        academyId: academy.id,
        remoteJid: recipientJid,
        type: "text",
        content: item.message,
        status: "pending",
        // sentAt will default to now()
      },
    });

    const job = await whatsappQueue.add("send-message", {
      academyId: academy.id,
      instanceName: academy.whatsappInstanceName!,
      recipientJid,
      message: item.message,
      isGroup: item.isGroup || false,
      messageLogId: log.id,
    });

    jobs.push({ jobId: job.id, logId: log.id });
  }

  return NextResponse.json({ success: true, jobs });
}
