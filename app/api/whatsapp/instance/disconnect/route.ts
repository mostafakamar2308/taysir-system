import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { logoutInstance, deleteInstance } from "@/lib/evolution-api";
import { decrypt } from "@/lib/encryption";
import { Role } from "@/types/user";
import { user } from "@/lib/auth";

export async function POST() {
  const currentUser = await user();
  if (
    !currentUser ||
    currentUser.role !== Role.Admin ||
    !currentUser.academyId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await db.admin.findUnique({
    where: { userId: currentUser.id },
    include: { academy: true },
  });

  if (!admin?.academy) {
    return NextResponse.json({ error: "Academy not found" }, { status: 400 });
  }

  const academy = admin.academy;

  if (!academy.whatsappInstanceName) {
    return NextResponse.json(
      { error: "No WhatsApp instance found" },
      { status: 400 },
    );
  }

  try {
    if (academy.whatsappInstanceToken) {
      try {
        const token = decrypt(academy.whatsappInstanceToken);
        await logoutInstance(academy.whatsappInstanceName, token);
      } catch (err) {
        console.warn("Logout from Evolution API failed:", err);
        try {
          await deleteInstance(academy.whatsappInstanceName);
        } catch (deleteErr) {
          console.warn("Delete instance failed:", deleteErr);
        }
      }
    }

    // Clear WhatsApp fields from academy record
    await db.academy.update({
      where: { id: academy.id },
      data: {
        whatsappInstanceName: null,
        whatsappInstanceToken: null,
        whatsappConnectionStatus: "disconnected",
        whatsappWebhookUrl: null,
        whatsappDisconnectedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to disconnect",
      },
      { status: 500 },
    );
  }
}
