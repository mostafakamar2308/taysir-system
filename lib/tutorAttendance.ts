import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { getSessionStatus } from "@/lib/session";

export const TUTOR_ATTENDANCE_SOURCE_AUTO = 0;
export const TUTOR_ATTENDANCE_SOURCE_SUPERVISOR = 1;

// Automatically mark a tutor as ATTENDED for a session as soon as the tutor
// performs an action (records a student's attendance or writes a report).
// Only auto-created rows (source = 0) are touched, so a supervisor's explicit
// override (source = 1) is never overwritten by tutor activity.
export const markTutorAttended = async (input: {
  sessionId: number;
  supervisorId: number | null;
}) => {
  const { sessionId, supervisorId } = input;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { cancelledBy: true, startTime: true },
  });
  if (!session || session.cancelledBy != null) return;
  if (getSessionStatus(session) !== SessionStatus.COMPLETED) return;

  const existing = await db.tutorAttendance.findUnique({
    where: { sessionId },
    select: { id: true, source: true },
  });

  if (existing) {
    // Never override a supervisor's explicit review (source = 1).
    if (existing.source !== TUTOR_ATTENDANCE_SOURCE_AUTO) return;
    await db.tutorAttendance.update({
      where: { id: existing.id },
      data: { status: AttendanceStatus.ATTENDED, reviewedAt: new Date() },
    });
  } else {
    await db.tutorAttendance.create({
      data: {
        sessionId,
        status: AttendanceStatus.ATTENDED,
        source: TUTOR_ATTENDANCE_SOURCE_AUTO,
        reviewedBy: supervisorId,
        reviewedAt: new Date(),
      },
    });
  }

  revalidatePath("/ar/dashboard/supervisor/sessions");
  revalidatePath("/ar/dashboard/supervisor");
  revalidatePath("/ar/dashboard/supervisor/reports");
  revalidatePath("/ar/dashboard/tutor/sessions");
  revalidatePath("/ar/dashboard/sessions");
};
