"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { getSessionStatus } from "@/lib/session";

export async function markStudentAttendanceByTutor(
  participantId: number,
  status: AttendanceStatus,
  reason?: string,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) throw new Error("غير مصرح");

  const participant = await db.sessionParticipant.findUnique({
    where: { id: participantId },
    include: { session: true },
  });
  if (!participant) throw new Error("المشارك غير موجود");
  if (participant.session.tutorId !== payload.tutorId)
    throw new Error("غير مصرح");

  // Ensure session is completed (optional, as per your old logic)
  if (getSessionStatus(participant.session) !== SessionStatus.COMPLETED) {
    throw new Error("لا يمكن تسجيل الحضور إلا بعد انتهاء الحصة");
  }

  await db.sessionParticipant.update({
    where: { id: participantId },
    data: {
      studentAttendanceStatus: status,
      reason: reason ?? null,
    },
  });

  revalidatePath("/ar/dashboard/tutor/sessions");
}
