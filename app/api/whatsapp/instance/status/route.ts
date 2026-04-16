import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getInstanceState } from "@/lib/evolution-api";
import { decrypt } from "@/lib/encryption";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";

export async function GET() {
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

  if (!academy.whatsappInstanceName || !academy.whatsappInstanceToken) {
    return NextResponse.json({ status: "disconnected" });
  }

  try {
    const token = decrypt(academy.whatsappInstanceToken);
    const state = await getInstanceState(academy.whatsappInstanceName, token);

    if (state === null) {
      await db.academy.update({
        where: { id: academy.id },
        data: {
          whatsappInstanceName: null,
          whatsappInstanceToken: null,
          whatsappConnectionStatus: "disconnected",
          whatsappDisconnectedAt: new Date(),
        },
      });
      return NextResponse.json({ status: "disconnected" });
    }

    let status = "disconnected";
    if (state === "open") status = "connected";
    else if (state === "connecting") status = "connecting";

    if (status !== academy.whatsappConnectionStatus) {
      await db.academy.update({
        where: { id: academy.id },
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
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error("Failed to get instance state:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
