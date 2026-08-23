"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { withResult, fail } from "@/lib/action-result";

export const setZoomLink = withResult(async (formData: FormData) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) return fail("غير مصرح");

  const zoomUrl = formData.get("zoomUrl") as string;

  if (!zoomUrl || !zoomUrl.startsWith("https://")) {
    return fail("يرجى إدخال رابط Zoom صحيح يبدأ بـ https://");
  }

  await db.tutor.update({
    where: { id: payload.tutorId },
    data: {
      zoomUrl,
      zoomAuthenticated: true,
    },
  });

  revalidatePath("/ar/dashboard/tutor/zoom");
});

export const unlinkZoom = withResult(async () => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) return fail("غير مصرح");

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
});
