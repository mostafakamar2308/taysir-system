"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import dayjs from "@/lib/dayjs";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getSessionStatus } from "@/lib/session";
import { StudentStatus } from "@/types/student";
import { recordStudentStatusChangeHistory } from "@/lib/history";
import type { DashboardSession } from "@/types/session";
import { decrementBalance, incrementBalance } from "@/lib/balance";
import { createZoomMeeting } from "@/lib/zoom";
import { user } from "@/lib/auth";
import { updateZoomMeeting } from "@/lib/zoom";

type CreateSessionInput = {
  studentId: number;
  tutorId: number;
  date: string;
  startTime: string;
  duration: number;
  topic?: string;
  notes?: string;
  isTrial?: boolean;
};

type UpdateSessionInput = Partial<CreateSessionInput> & {
  id: number;
};

export async function createSession(input: CreateSessionInput) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) throw new Error("غير مصرح");

  if (currentUser.role === Role.Tutor) {
    const tutor = await db.tutor.findUnique({
      where: { userId: currentUser.id },
      select: { id: true },
    });
    if (input.tutorId !== tutor?.id) {
      throw new Error("غير مصرح: يمكنك فقط إضافة حصص لنفسك");
    }
  }

  const start = dayjs.utc(input.startTime);
  const startDate = start.toDate();
  const endDate = dayjs.utc(start).add(input.duration, "minute").toDate();

  if (start.isBefore(dayjs()))
    throw new Error("لا يمكن أن تكون الحصة في الماضى");

  const conflicts = await db.session.findMany({
    where: {
      OR: [{ tutorId: input.tutorId }, { studentId: input.studentId }],
      startTime: { lt: endDate },
      endTime: { gt: startDate },
      cancelledBy: { not: null },
    },
    include: { tutor: { include: { user: true } }, student: true },
  });

  if (conflicts.length > 0) {
    throw new Error("هناك حصة للمعلم في هذا الوقت");
  }
  const student = await db.student.findUnique({
    where: { id: input.studentId },
  });
  if (!student) throw new Error("هذا الطالب غير موجود");

  if (student.sessionsBalance < 1 && !input.isTrial)
    throw new Error(
      "هذا الطالب استهلك كل حصص الشهر، برجاء تجديد الاشتراك أولا",
    );

  if (input.isTrial && student.status === StudentStatus.lead) {
    await db.student.update({
      where: {
        id: input.studentId,
      },
      data: {
        status: StudentStatus.trial,
      },
    });
    recordStudentStatusChangeHistory(
      input.studentId,
      student.status,
      StudentStatus.trial,
      currentUser.id,
      currentUser.academyId,
    );
  }

  const session = await db.$transaction(async (tx) => {
    if (!input.isTrial) await decrementBalance(input.studentId, tx);
    return tx.session.create({
      data: {
        startTime: startDate,
        endTime: endDate,
        durationMinutes: input.duration,
        studentId: input.studentId,
        tutorId: input.tutorId,
        academyId: currentUser.academyId!,
        topic: input.topic,
        notes: input.notes,
        isTrial: input.isTrial ?? false,
      },
    });
  });

  // Zoom integration
  const tutor = await db.tutor.findUnique({
    where: { id: input.tutorId },
    select: { zoomAuthenticated: true, id: true },
  });

  if (tutor?.zoomAuthenticated) {
    try {
      const meeting = await createZoomMeeting(tutor.id, {
        topic: input.topic || "Session",
        startTime: startDate,
        duration: input.duration,
      });
      await db.session.update({
        where: { id: session.id },
        data: {
          zoomMeetingId: meeting.id,
          zoomJoinUrl: meeting.joinUrl,
          zoomMeetingUuid: meeting.uuid,
          zoomStartUrl: meeting.startUrl,
        },
      });
    } catch (error) {
      console.error("Zoom meeting creation failed:", error);
    }
  }

  revalidatePath("/ar/dashboard/sessions");
  revalidatePath("/ar/dashboard/tutor/sessions");
  return session;
}

export async function updateSession(input: UpdateSessionInput) {
  const existing = await db.session.findUnique({
    where: { id: input.id },
  });
  if (!existing) throw new Error("Session not found");
  const newStart = input.startTime
    ? dayjs.utc(input.startTime).toDate()
    : existing.startTime;
  const newEnd = input.duration
    ? dayjs.utc(newStart).add(input.duration, "minute").toDate()
    : existing.endTime;

  const updated = await db.session.update({
    where: { id: input.id },
    data: {
      startTime: newStart,
      endTime: newEnd,
      durationMinutes: input.duration ?? existing.durationMinutes,
      topic: input.topic,
      notes: input.notes,
    },
  });

  if (updated.zoomMeetingId) {
    try {
      await updateZoomMeeting(updated.zoomMeetingId, updated.tutorId, {
        topic: updated.topic || undefined,
        startTime: updated.startTime,
        duration: updated.durationMinutes,
      });
    } catch (error) {
      console.error("Zoom meeting update failed:", error);
    }
  }

  revalidatePath("/ar/dashboard/sessions");
  return updated;
}

export async function deleteSession(id: number) {
  const session = await db.session.findUnique({
    where: { id },
  });
  if (!session) throw new Error("Session not found");
  if (session.zoomMeetingId) {
    try {
      const { deleteZoomMeeting } = await import("@/lib/zoom");
      await deleteZoomMeeting(session.zoomMeetingId, session.tutorId);
    } catch (error) {
      console.error("Zoom meeting deletion failed:", error);
    }
  }
  await db.$transaction(async (tx) => {
    if (!session.cancelledBy && !session.isTrial) {
      await incrementBalance(session.studentId, tx);
    }
    await tx.attendance.deleteMany({ where: { sessionId: id } });
    await tx.session.delete({ where: { id } });
  });

  revalidatePath("/ar/dashboard/sessions");
}

export async function updateAttendance(
  sessionId: number,
  role: Role,
  status: AttendanceStatus,
  reason?: string,
) {
  const attendance = await db.attendance.upsert({
    where: { sessionId },
    update: {
      studentAttendanceStatus: status,
      tutorAttendanceStatus:
        role === Role.Tutor ? status : AttendanceStatus.ATTENDED,
      reason,
    },
    create: {
      sessionId,
      studentAttendanceStatus: status,
      tutorAttendanceStatus: status,
      reason,
    },
  });

  revalidatePath("/ar/dashboard/sessions");
  return attendance;
}

export async function getSessionsForWeek(startDate: Date, endDate: Date) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const sessions = await db.session.findMany({
    where: {
      startTime: { gte: startDate, lt: endDate },
      academyId: payload.academyId,
    },
    include: {
      student: { select: { user: { select: { name: true } } } },
      tutor: { include: { user: true } },
      attendance: true,
    },
    orderBy: { startTime: "asc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    durationMinutes: s.durationMinutes,
    isTrial: s.isTrial,
    status: getSessionStatus(s),
    topic: s.topic,
    notes: s.notes,
    studentId: s.studentId,
    studentName: s.student.user.name || "",
    zoomMeetingId: s.zoomMeetingId,
    zoomJoinUrl: s.zoomJoinUrl,
    zoomStartUrl: s.zoomStartUrl,
    tutorId: s.tutorId,
    tutorName: s.tutor.user.name,
    attendance: s.attendance
      ? {
          id: s.attendance.id,
          tutorAttendance: s.attendance.tutorAttendanceStatus,
          studentAttendance: s.attendance.studentAttendanceStatus,
          reason: s.attendance.reason,
        }
      : undefined,
  }));
}

export async function updateStudentSessionAttendance(
  sessionId: number,
  studentAttendanceStatus: number,
  reason?: string,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { attendance: true },
  });
  if (!session) throw new Error("الحصة غير موجودة");

  if (getSessionStatus(session) !== SessionStatus.COMPLETED) {
    throw new Error("لا يمكن تسجيل الحضور إلا للحصص المكتملة");
  }

  await db.attendance.upsert({
    where: { sessionId },
    update: {
      studentAttendanceStatus,
      reason,
    },
    create: {
      sessionId,
      studentAttendanceStatus,
      tutorAttendanceStatus: AttendanceStatus.ATTENDED,
      reason,
    },
  });

  revalidatePath(`/ar/dashboard/students/${session.studentId}`);
  revalidatePath("/ar/dashboard/sessions");
}

export async function getSessionDetails(
  sessionId: number,
): Promise<DashboardSession | null> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      student: { select: { user: { select: { name: true, phone: true } } } },
      tutor: { include: { user: { select: { name: true, phone: true } } } },
      attendance: true,
      sessionReport: true,
    },
  });

  if (!session) return null;

  return {
    id: session.id,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    durationMinutes: session.durationMinutes,
    status: getSessionStatus(session),
    topic: session.topic,
    notes: session.notes,
    studentId: session.studentId,
    studentName: session.student.user.name || "",
    tutorId: session.tutorId,
    isTrial: session.isTrial,
    tutorName: session.tutor.user.name ?? "",
    zoomMeetingId: session.zoomMeetingId,
    zoomJoinUrl: session.zoomJoinUrl,
    zoomStartUrl: session.zoomStartUrl,
    attendance: session.attendance
      ? {
          id: session.attendance.id,
          tutorAttendance: session.attendance.tutorAttendanceStatus,
          studentAttendance: session.attendance.studentAttendanceStatus,
          reason: session.attendance.reason,
        }
      : undefined,
    report: session.sessionReport
      ? {
          id: session.sessionReport.id,
          rating: session.sessionReport.rating,
          outcomes: session.sessionReport.outcomes,
          strengths: session.sessionReport.strengths,
          weaknesses: session.sessionReport.weaknesses,
          nextGoals: session.sessionReport.nextGoals,
          comments: session.sessionReport.comments,
        }
      : undefined,
  };
}

export async function cancelSession(sessionId: number, cancelledBy: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session || session.cancelledBy !== null)
    throw new Error("لا يمكن إلغاء هذه الحصة");
  if (session.zoomMeetingId) {
    try {
      const { deleteZoomMeeting } = await import("@/lib/zoom");
      await deleteZoomMeeting(session.zoomMeetingId, session.tutorId);
    } catch (error) {
      console.error("Zoom meeting deletion failed:", error);
    }
  }
  await db.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionId },
      data: { cancelledBy },
    });
    if (!session.isTrial) {
      await incrementBalance(session.studentId, tx);
    }
  });

  revalidatePath("/ar/dashboard/sessions");
  revalidatePath(`/ar/dashboard/students/${session.studentId}`);
}
