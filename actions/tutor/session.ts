"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";

export async function updateSessionDetails(
  sessionId: number,
  data: { topic?: string | null; notes?: string | null },
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { tutorId: true },
  });
  if (!session) throw new Error("الحصة غير موجودة");
  if (session.tutorId !== payload.tutorId) throw new Error("غير مصرح");

  await db.session.update({
    where: { id: sessionId },
    data: {
      topic: data.topic ?? null,
      notes: data.notes ?? null,
    },
  });

  revalidatePath("/tutor/sessions");
}

export async function updateSessionZoomLinks(
  sessionId: number,
  data: {
    zoomJoinUrl?: string | null;
    zoomStartUrl?: string | null;
  },
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { tutorId: true },
  });
  if (!session) throw new Error("الحصة غير موجودة");
  if (session.tutorId !== payload.tutorId) throw new Error("غير مصرح");

  await db.session.update({
    where: { id: sessionId },
    data: {
      zoomJoinUrl: data.zoomJoinUrl ?? undefined,
      zoomStartUrl: data.zoomStartUrl ?? undefined,
    },
  });

  revalidatePath("/ar/dashboard/tutor/sessions");
}
