"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { withResult, fail } from "@/lib/action-result";
import { getSessionStatus } from "@/lib/session";
import { SessionStatus } from "@/types/session";

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

export const updateSessionZoomLink = withResult(
  async (
    sessionId: number,
    data: {
      zoomUrl?: string | null;
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
        zoomUrl: data.zoomUrl ?? undefined,
      },
    });

    revalidatePath("/ar/dashboard/tutor/sessions");
  },
);

export const updateSessionRecordingLink = withResult(
  async (
    sessionId: number,
    data: {
      recordingLink?: string | null;
    },
  ) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.tutorId) return fail("غير مصرح");

    const session = await db.session.findUnique({
      where: { id: sessionId },
      select: { tutorId: true, startTime: true, cancelledBy: true },
    });
    if (!session) return fail("الحصة غير موجودة");
    if (session.tutorId !== payload.tutorId) return fail("غير مصرح");
    if (getSessionStatus(session) !== SessionStatus.COMPLETED) {
      return fail("لا يمكن إضافة رابط التسجيل إلا بعد انتهاء الحصة");
    }
    if (data.recordingLink && !data.recordingLink.startsWith("https://")) {
      return fail("رابط غير صحيح");
    }

    await db.session.update({
      where: { id: sessionId },
      data: {
        recordingLink: data.recordingLink ?? null,
      },
    });

    revalidatePath("/ar/dashboard/tutor/sessions");
    revalidatePath("/ar/dashboard/tutor");
  },
);
