"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { getSessionStatus } from "@/lib/session";

export async function markStudentAttendanceByTutor(
  sessionId: number,
  status: AttendanceStatus,
  reason?: string,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw new Error("الحصة غير موجودة");
  if (session.tutorId !== payload.tutorId) throw new Error("غير مصرح");
  if (getSessionStatus(session) !== SessionStatus.COMPLETED) {
    throw new Error("لا يمكن تسجيل الحضور إلا بعد انتهاء الحصة");
  }

  await db.attendance.upsert({
    where: { sessionId },
    update: {
      studentAttendanceStatus: status,
      tutorAttendanceStatus: AttendanceStatus.ATTENDED,
      reason: reason ?? null,
    },
    create: {
      sessionId,
      tutorAttendanceStatus: AttendanceStatus.ATTENDED,
      studentAttendanceStatus: status,
      reason: reason ?? null,
    },
  });

  revalidatePath("/ar/dashboard/tutor/sessions");
}
