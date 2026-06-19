"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import dayjs from "@/lib/dayjs";
import { AdminSessionClientData, AttendanceStatus } from "@/types/session";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getSessionStatus } from "@/lib/session";
import { StudentStatus } from "@/types/student";
import { recordStudentStatusChangeHistory } from "@/lib/history";
import { decrementBalance, incrementBalance } from "@/lib/balance";
import { createZoomMeeting } from "@/lib/zoom";
import { user } from "@/lib/auth";
import { updateZoomMeeting } from "@/lib/zoom";

type CreateSessionInput = {
  studentIds: number[];
  tutorId: number;
  date: string;
  startTime: string;
  duration: number;
  topic?: string;
  notes?: string;
  isTrial?: boolean;
};

export async function createSession(input: CreateSessionInput) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) throw new Error("غير مصرح");

  // Tutor can only create sessions for themselves
  if (currentUser.role === Role.Tutor) {
    const tutor = await db.tutor.findUnique({
      where: { userId: currentUser.id },
      select: { id: true },
    });
    if (input.tutorId !== tutor?.id) {
      throw new Error("غير مصرح: يمكنك فقط إضافة حصص لنفسك");
    }
  }

  // Basic validations
  const start = dayjs.utc(input.startTime);
  const startDate = start.toDate();
  const endDate = dayjs.utc(start).add(input.duration, "minute").toDate();

  if (start.isBefore(dayjs()))
    throw new Error("لا يمكن أن تكون الحصة في الماضى");

  // Check conflicts for tutor and ALL students
  const conflicts = await db.session.findMany({
    where: {
      OR: [
        { tutorId: input.tutorId },
        { participants: { some: { studentId: { in: input.studentIds } } } },
      ],
      startTime: { lt: endDate },
      endTime: { gt: startDate },
      cancelledBy: null,
    },
    include: {
      participants: { include: { student: { include: { user: true } } } },
      tutor: { include: { user: true } },
    },
  });

  if (conflicts.length > 0) {
    const conflictNames = conflicts.flatMap((c) =>
      c.participants.map((p) => p.student.user.name),
    );
    throw new Error(`تعارض في المواعيد: ${conflictNames.join("، ")}`);
  }

  // Validate students and balance
  const students = await db.student.findMany({
    where: { id: { in: input.studentIds } },
    include: { user: true },
  });
  if (students.length !== input.studentIds.length)
    throw new Error("أحد الطلاب غير موجود");

  if (!input.isTrial) {
    const lowBalance = students.filter((s) => s.sessionsBalance < 1);
    if (lowBalance.length > 0) {
      const names = lowBalance.map((s) => s.user?.name || s.id).join("، ");
      throw new Error(`الطلاب التاليون ليس لديهم رصيد كاف: ${names}`);
    }
  }

  // Handle trial student status change
  if (input.isTrial) {
    for (const student of students) {
      if (student.status === StudentStatus.lead) {
        await db.student.update({
          where: { id: student.id },
          data: { status: StudentStatus.trial },
        });
        recordStudentStatusChangeHistory(
          student.id,
          student.status,
          StudentStatus.trial,
          currentUser.id,
          currentUser.academyId!,
        );
      }
    }
  }

  // Create session + participants in transaction
  const session = await db.$transaction(async (tx) => {
    // Decrement balance for non-trial
    if (!input.isTrial) {
      for (const student of students) {
        await decrementBalance(student.id, tx);
      }
    }

    const created = await tx.session.create({
      data: {
        startTime: startDate,
        endTime: endDate,
        durationMinutes: input.duration,
        tutorId: input.tutorId,
        academyId: currentUser.academyId!,
        topic: input.topic,
        notes: input.notes,
        isTrial: input.isTrial ?? false,
      },
    });

    for (const student of students) {
      await tx.student.update({
        data: {
          tutorId: input.tutorId,
        },
        where: {
          id: student.id,
        },
      });
    }

    // Create participants
    await tx.sessionParticipant.createMany({
      data: input.studentIds.map((studentId) => ({
        sessionId: created.id,
        studentId,
        balanceDeducted: !input.isTrial,
      })),
    });

    return created;
  });

  // Zoom integration (unchanged)
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

export type UpdateSessionInput = {
  id: number;
  date?: string;
  startTime?: string;
  duration?: number;
  topic?: string;
  notes?: string;
};

export async function updateSession(input: UpdateSessionInput) {
  const existing = await db.session.findUnique({
    where: { id: input.id },
  });
  if (!existing) throw new Error("Session not found");

  const newStart = input.startTime
    ? dayjs.utc(input.startTime).toDate()
    : existing.startTime;
  const newEnd =
    input.duration || input.startTime
      ? dayjs
          .utc(newStart)
          .add(input.duration || existing.durationMinutes, "minute")
          .toDate()
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

export async function updateAttendance(
  participantId: number,
  studentStatus: AttendanceStatus,
  reason?: string,
) {
  const participant = await db.sessionParticipant.findUnique({
    where: { id: participantId },
    include: { session: true },
  });
  if (!participant) throw new Error("المشارك غير موجود");

  await db.sessionParticipant.update({
    where: { id: participantId },
    data: {
      studentAttendanceStatus: studentStatus,
      reason: reason ?? null,
    },
  });

  revalidatePath("/ar/dashboard/sessions");
  return participant;
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
      participants: {
        include: {
          student: { select: { user: { select: { name: true } } } },
        },
      },
      tutor: { include: { user: true } },
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
    studentIds: s.participants.map((p) => p.studentId),
    studentNames: s.participants.map((p) => p.student.user.name || ""),
    zoomMeetingId: s.zoomMeetingId,
    zoomJoinUrl: s.zoomJoinUrl,
    zoomStartUrl: s.zoomStartUrl,
    tutorId: s.tutorId,
    tutorName: s.tutor.user.name,
    // Attendance / reports will be loaded separately or included per participant if needed.
    // For a week view, you might just return a summary; adjust as needed.
  }));
}

export async function getSessionDetails(sessionId: number) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: {
          student: {
            select: { user: { select: { name: true, phone: true } } },
          },
          report: true,
        },
      },
      tutor: { include: { user: { select: { name: true, phone: true } } } },
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
    isTrial: session.isTrial,
    zoomMeetingId: session.zoomMeetingId,
    zoomJoinUrl: session.zoomJoinUrl,
    zoomStartUrl: session.zoomStartUrl,
    tutorId: session.tutorId,
    tutorName: session.tutor.user.name ?? "",
    participants: session.participants.map((p) => ({
      id: p.id,
      studentId: p.studentId,
      studentName: p.student.user.name ?? "",
      studentPhone: p.student.user.phone ?? "",
      attendanceStatus: p.studentAttendanceStatus,
      attendanceReason: p.reason,
      balanceDeducted: p.balanceDeducted,
      cancelledBy: p.cancelledBy,
      report: p.report
        ? {
            id: p.report.id,
            rating: p.report.rating,
            outcomes: p.report.outcomes,
            strengths: p.report.strengths,
            weaknesses: p.report.weaknesses,
            nextGoals: p.report.nextGoals,
            comments: p.report.comments,
          }
        : null,
    })),
  };
}

export async function getSessionDetailsForManagement(
  sessionId: number,
): Promise<AdminSessionClientData | null> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: {
          student: {
            select: { id: true, user: { select: { name: true, phone: true } } },
          },
          report: true,
        },
      },
      tutor: { include: { user: { select: { name: true } } } },
    },
  });
  if (!session) return null;

  const participants = session.participants.map((p) => ({
    participantId: p.id,
    studentId: p.studentId,
    studentName: p.student.user.name || "",
    studentPhone: p.student.user.phone,
    attendanceStatus: p.studentAttendanceStatus,
    report: p.report
      ? {
          id: p.report.id,
          rating: p.report.rating,
          outcomes: p.report.outcomes,
          strengths: p.report.strengths,
          weaknesses: p.report.weaknesses,
          nextGoals: p.report.nextGoals,
          comments: p.report.comments,
        }
      : null,
  }));

  const first = participants[0];
  return {
    id: session.id,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    durationMinutes: session.durationMinutes,
    status: getSessionStatus(session),
    topic: session.topic,
    notes: session.notes,
    tutorId: session.tutorId,
    tutorName: session.tutor.user.name ?? null,
    isTrial: session.isTrial,
    studentId: first?.studentId ?? null,
    studentName: participants.map((p) => p.studentName).join("، ") || "",
    studentPhone: first?.studentPhone ?? null,
    zoomMeetingId: session.zoomMeetingId,
    zoomJoinUrl: session.zoomJoinUrl,
    zoomStartUrl: session.zoomStartUrl,
    attendance: first
      ? {
          id: first.participantId,
          tutorAttendance: null,
          studentAttendance: first.attendanceStatus,
          reason: null,
        }
      : undefined,
    report: first?.report ?? undefined,
    participants,
  };
}

export async function cancelSession(sessionId: number, cancelledBy: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });
  if (!session || session.cancelledBy !== null)
    throw new Error("لا يمكن إلغاء هذه الحصة");

  await db.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionId },
      data: { cancelledBy },
    });

    for (const participant of session.participants) {
      if (participant.balanceDeducted && !session.isTrial) {
        await incrementBalance(participant.studentId, tx);
      }
    }
  });

  revalidatePath("/ar/dashboard/sessions");
  for (const p of session.participants) {
    revalidatePath(`/ar/dashboard/students/${p.studentId}`);
  }
}

export async function deleteSession(sessionId: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });
  if (!session) throw new Error("الحصة غير موجودة");
  if (session.cancelledBy !== null) throw new Error("الحصة ملغية بالفعل");

  await db.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionId },
      data: { cancelledBy: payload.id },
    });

    // Refund each participant that had balance deducted (non-trial)
    for (const participant of session.participants) {
      if (participant.balanceDeducted && !session.isTrial) {
        await incrementBalance(participant.studentId, tx);
      }
    }
  });

  revalidatePath("/ar/dashboard/sessions");
}
