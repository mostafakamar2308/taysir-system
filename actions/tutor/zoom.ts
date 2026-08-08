"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";

export async function setZoomLink(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) throw new Error("غير مصرح");

  const zoomUrl = formData.get("zoomUrl") as string;

  if (!zoomUrl || !zoomUrl.startsWith("https://")) {
    throw new Error("يرجى إدخال رابط Zoom صحيح يبدأ بـ https://");
  }

  await db.tutor.update({
    where: { id: payload.tutorId },
    data: {
      zoomUrl,
      zoomAuthenticated: true,
    },
  });

  revalidatePath("/ar/dashboard/tutor/zoom");
}

export async function unlinkZoom() {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) throw new Error("غير مصرح");

  await db.tutor.update({
    where: { id: payload.tutorId },
    data: {
      zoomAuthenticated: false,
      zoomAccessToken: null,
      zoomRefreshToken: null,
      zoomTokenExpiry: null,
      zoomUserId: null,
      zoomUrl: null,
    },
  });

  revalidatePath("/ar/dashboard/tutor/zoom");
}
