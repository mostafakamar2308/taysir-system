"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { withResult, fail } from "@/lib/action-result";

export const updateSessionDetails = withResult(
  async (sessionId: number, data: { topic?: string | null; notes?: string | null }) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.tutorId) return fail("غير مصرح");

    const session = await db.session.findUnique({
      where: { id: sessionId },
      select: { tutorId: true },
    });
    if (!session) return fail("الحصة غير موجودة");
    if (session.tutorId !== payload.tutorId) return fail("غير مصرح");

    await db.session.update({
      where: { id: sessionId },
      data: {
        topic: data.topic ?? null,
        notes: data.notes ?? null,
      },
    });

    revalidatePath("/tutor/sessions");
  },
);

export const updateSessionZoomLinks = withResult(
  async (
    sessionId: number,
    data: {
      zoomJoinUrl?: string | null;
      zoomStartUrl?: string | null;
    },
  ) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.tutorId) return fail("غير مصرح");

    const session = await db.session.findUnique({
      where: { id: sessionId },
      select: { tutorId: true },
    });
    if (!session) return fail("الحصة غير موجودة");
    if (session.tutorId !== payload.tutorId) return fail("غير مصرح");

    await db.session.update({
      where: { id: sessionId },
      data: {
        zoomUrl: data.zoomJoinUrl ?? data.zoomStartUrl ?? undefined,
      },
    });

    revalidatePath("/ar/dashboard/tutor/sessions");
  },
);
