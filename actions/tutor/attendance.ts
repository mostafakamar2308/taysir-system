"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { getSessionStatus } from "@/lib/session";
import { withResult, fail } from "@/lib/action-result";
import { markTutorAttended } from "@/lib/tutorAttendance";

export const markStudentAttendanceByTutor = withResult(
  async (
    participantId: number,
    status: AttendanceStatus,
    reason?: string,
  ) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.tutorId) return fail("غير مصرح");

    const participant = await db.sessionParticipant.findUnique({
      where: { id: participantId },
      include: { session: true },
    });
    if (!participant) return fail("المشارك غير موجود");
    if (participant.session.tutorId !== payload.tutorId)
      return fail("غير مصرح");

    // Ensure session is completed (optional, as per your old logic)
    if (getSessionStatus(participant.session) !== SessionStatus.COMPLETED) {
      return fail("لا يمكن تسجيل الحضور إلا بعد انتهاء الحصة");
    }

    await db.sessionParticipant.update({
      where: { id: participantId },
      data: {
        studentAttendanceStatus: status,
        reason: reason ?? null,
      },
    });

    await markTutorAttended({
      sessionId: participant.session.id,
      supervisorId: participant.session.supervisorId,
    });

    revalidatePath("/ar/dashboard/tutor/sessions");
    revalidatePath("/ar/dashboard/tutor");
  },
);
