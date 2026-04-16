import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { createEvolutionInstance } from "@/lib/evolution-api";
import { encrypt } from "@/lib/encryption";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";

export async function POST() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Admin || !currentUser.academyId)
    throw new Error("BRUH you are not a user");
  const admin = await db.admin.findUnique({
    where: { userId: currentUser.id },
    include: { academy: true },
  });

  if (!admin?.academy) {
    return NextResponse.json({ error: "Academy not found" }, { status: 400 });
  }

  const academy = admin.academy;

  if (academy.whatsappConnectionStatus === "connected") {
    return NextResponse.json(
      { error: "WhatsApp already connected" },
      { status: 400 },
    );
  }

  const instanceName = `academy_${academy.id}_${Date.now()}`;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook/${academy.id}`;
  console.log({ webhookUrl, instanceName });

  try {
    const result = await createEvolutionInstance({
      instanceName,
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhook_by_events: false,
        events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT"],
      },
    });

    console.log(result);

    const instanceToken = result.instance.token || result.hash;

    if (!instanceToken) {
      throw new Error("Instance token not returned from Evolution API");
    }

    const encryptedToken = encrypt(instanceToken);

    await db.academy.update({
      where: { id: academy.id },
      data: {
        whatsappInstanceName: instanceName,
        whatsappInstanceToken: encryptedToken,
        whatsappConnectionStatus: "connecting",
        whatsappWebhookUrl: webhookUrl,
      },
    });

    return NextResponse.json({ success: true, instanceName });
  } catch (error) {
    console.error("Failed to create WhatsApp instance: ", error);
    return NextResponse.json(
      { error: error instanceof Error ? error?.message : "there is an issue!" },
      { status: 500 },
    );
  }
}
