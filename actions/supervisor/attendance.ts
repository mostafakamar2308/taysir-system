"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  assertSupervisorCanAccessSession,
  getCurrentSupervisor,
} from "@/lib/supervisor";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { getSessionStatus } from "@/lib/session";
import { withResult, fail } from "@/lib/action-result";
import { TUTOR_ATTENDANCE_SOURCE_SUPERVISOR } from "@/lib/tutorAttendance";

export const markStudentAttendanceBySupervisor = withResult(async (
  participantId: number,
  status: AttendanceStatus,
  reason?: string,
) => {
    const supervisor = await getCurrentSupervisor();
    if (!supervisor) return fail("غير مصرح");

    const participant = await db.sessionParticipant.findUnique({
      where: { id: participantId },
      include: {
        session: {
          select: {
            id: true,
            supervisorId: true,
            startTime: true,
            cancelledBy: true,
            tutor: { select: { defaultSupervisorId: true } },
          },
        },
      },
    });
    if (!participant) return fail("المشارك غير موجود");
    await assertSupervisorCanAccessSession(supervisor.id, participant.session);

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

    revalidatePath("/ar/dashboard/supervisor/sessions");
    revalidatePath("/ar/dashboard/supervisor");
});

export const upsertTutorAttendance = withResult(async (
  sessionId: number,
  status: AttendanceStatus,
  notes?: string,
) => {
    const supervisor = await getCurrentSupervisor();
    if (!supervisor) return fail("غير مصرح");

    const session = await db.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        supervisorId: true,
        startTime: true,
        cancelledBy: true,
        tutor: { select: { defaultSupervisorId: true } },
      },
    });
    if (!session) return fail("الحصة غير موجودة");
    await assertSupervisorCanAccessSession(supervisor.id, session);

    if (getSessionStatus(session) !== SessionStatus.COMPLETED) {
      return fail("لا يمكن تقييم حضور المعلم إلا بعد انتهاء الحصة");
    }

    const attendance = await db.tutorAttendance.upsert({
      where: { sessionId },
      update: {
        status,
        notes: notes ?? null,
        source: TUTOR_ATTENDANCE_SOURCE_SUPERVISOR,
        reviewedBy: supervisor.id,
        reviewedAt: new Date(),
      },
      create: {
        sessionId,
        status,
        notes: notes ?? null,
        source: TUTOR_ATTENDANCE_SOURCE_SUPERVISOR,
        reviewedBy: supervisor.id,
        reviewedAt: new Date(),
      },
      include: {
        supervisor: { select: { user: { select: { name: true } } } },
      },
    });

    revalidatePath("/ar/dashboard/supervisor/sessions");
    revalidatePath("/ar/dashboard/supervisor");
    revalidatePath("/ar/dashboard/supervisor/reports");

    return {
      id: attendance.id,
      status: attendance.status,
      notes: attendance.notes,
      reviewedAt: attendance.reviewedAt?.toISOString() ?? null,
      supervisorName: attendance.supervisor?.user.name ?? null,
    };
});
