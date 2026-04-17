import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { academyId: string } },
) {
  const academyId = parseInt(params.academyId);

  try {
    const body = await req.json();
    const event = body.event;
    const instanceName = body.instance;

    const academy = await db.academy.findUnique({
      where: { id: academyId },
    });

    if (!academy || academy.whatsappInstanceName !== instanceName) {
      return NextResponse.json(
        { error: "Invalid academy or instance" },
        { status: 400 },
      );
    }

    switch (event) {
      case "QRCODE_UPDATED":
        // You could implement WebSockets here to push the new QR code to the frontend
        console.log(`QR code updated for academy ${academyId}`);
        break;

      case "MESSAGES_UPDATE":
        const messageId = body.data.key.id;
        const updateData: Record<string, Date | string> = {};
        if (body.data.status === "DELIVERY_ACK")
          updateData.deliveredAt = new Date();
        if (body.data.status === "READ") updateData.readAt = new Date();
        if (body.data.status === "ERROR") {
          updateData.status = "failed";
          updateData.errorMessage = "Delivery failed";
        }

        await db.whatsAppMessage.updateMany({
          where: { messageId, academyId },
          data: updateData,
        });

      case "CONNECTION_UPDATE":
        const state = body.data?.state;
        let status = "disconnected";
        if (state === "open") status = "connected";
        else if (state === "connecting") status = "connecting";

        await db.academy.update({
          where: { id: academyId },
          data: {
            whatsappConnectionStatus: status,
            whatsappConnectedAt:
              status === "connected" ? new Date() : academy.whatsappConnectedAt,
            whatsappDisconnectedAt:
              status === "disconnected"
                ? new Date()
                : academy.whatsappDisconnectedAt,
          },
        });
        break;

      case "MESSAGES_UPSERT":
        const messageData = body.data;
        await db.whatsAppMessage.create({
          data: {
            academyId,
            messageId: messageData.key.id,
            remoteJid: messageData.key.remoteJid,
            type: messageData.messageType,
            content:
              messageData.message?.conversation ||
              messageData.message?.extendedTextMessage?.text,
            status: "delivered",
            sentAt: new Date(parseInt(messageData.messageTimestamp) * 1000),
          },
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
