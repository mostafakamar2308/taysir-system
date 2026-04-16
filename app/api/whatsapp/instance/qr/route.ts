import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { fetchInstanceQR } from "@/lib/evolution-api";
import { decrypt } from "@/lib/encryption";
import { Role } from "@/types/user";
import { user } from "@/lib/auth";

export async function GET() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Admin || !currentUser.academyId)
    throw new Error("BRUH you are not a user");

  const admin = await db.admin.findUnique({
    where: { userId: currentUser.id },
    include: { academy: true, user: true },
  });

  if (!admin?.academy) {
    return NextResponse.json({ error: "Academy not found" }, { status: 400 });
  }

  const academy = admin.academy;

  if (!academy.whatsappInstanceName || !academy.whatsappInstanceToken) {
    return NextResponse.json(
      { error: "WhatsApp instance not created" },
      { status: 400 },
    );
  }

  try {
    const token = decrypt(academy.whatsappInstanceToken);
    const qrData = await fetchInstanceQR(
      academy.whatsappInstanceName,
      token,
      admin.user.phone,
    );

    // Check if QR code is ready
    if (qrData.base64) {
      return NextResponse.json({ qr: qrData.base64, ready: true });
    } else {
      // QR not yet generated
      return NextResponse.json({
        ready: false,
        message: "QR code not ready yet",
      });
    }
  } catch (error) {
    console.error("Failed to fetch WhatsApp QR: ", error);
    return NextResponse.json(
      { error: error instanceof Error ? error?.message : "Failed to fetch QR" },
      { status: 500 },
    );
  }
}
