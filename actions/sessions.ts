"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import dayjs from "@/lib/dayjs";
import { AttendanceStatus, SessionGroup } from "@/types/session";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getSessionStatus } from "@/lib/session";
import { StudentStatus } from "@/types/student";
import { recordStudentStatusChangeHistory } from "@/lib/history";
import { decrementBalance, incrementBalance } from "@/lib/balance";
import { user } from "@/lib/auth";

type CreateSessionInput = {
  groupId: number;
  tutorId: number;
  date: string; // YYYY-MM-DD (client only)
  startTime: string; // ISO 8601, already UTC
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

  const start = dayjs.utc(input.startTime);
  const startDate = start.toDate();
  const computedEnd = start.add(input.duration, "minute").toDate();

  if (start.isBefore(dayjs()))
    throw new Error("لا يمكن أن تكون الحصة في الماضى");

  // Fetch group with members and supervisor
  const group = await db.group.findUnique({
    where: { id: input.groupId },
    include: {
      members: {
        where: { active: true },
        include: { student: { include: { user: true } } },
      },
      currentTutor: {
        select: {
          id: true,
          defaultSupervisorId: true,
          baseGroupHourlyRate: true,
          baseHourlyRate: true,
        },
      },
    },
  });

  if (!group || group.academyId !== currentUser.academyId)
    throw new Error("المجموعة غير موجودة");

  const students = group.members.map((m) => m.student);
  const studentIds = students.map((s) => s.id);

  // Conflict check (computed endTime)
  const conflicts = await db.session.findMany({
    where: {
      OR: [
        { tutorId: input.tutorId },
        { participants: { some: { studentId: { in: studentIds } } } },
      ],
      startTime: { lt: computedEnd },
      // We don't have an endTime column, so we need to filter by startTime + duration later
      cancelledBy: null,
    },
    include: {
      participants: { include: { student: { include: { user: true } } } },
      group: { include: { currentTutor: { include: { user: true } } } },
    },
  });

  // Post‑filter for overlapping intervals (since we can't express `startTime + durationMinutes` in Prisma where)
  const overlapping = conflicts.filter((s) => {
    const sEnd = dayjs(s.startTime).add(s.durationMinutes, "minute").toDate();
    return sEnd > startDate;
  });

  if (overlapping.length > 0) {
    const conflictNames = overlapping.flatMap((c) =>
      c.participants.map((p) => p.student.user.name),
    );
    throw new Error(`تعارض في المواعيد: ${conflictNames.join("، ")}`);
  }

  // Trial status change
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

  // Choose one: use the tutor's default if set, otherwise pick a random supervisor
  let supervisorId: number | undefined =
    group.currentTutor.defaultSupervisorId ?? undefined;
  if (!supervisorId) {
    const supervisors = await db.supervisor.findMany({
      where: { academyId: currentUser.academyId! },
      select: { id: true },
    });
    const randomIndex = Math.floor(Math.random() * supervisors.length);
    supervisorId = supervisors[randomIndex].id;
  }
  if (!supervisorId) {
    throw new Error("لا يوجد مشرف متاح في الأكاديمية. يرجى إضافة مشرف أولاً.");
  }

  const isPrivate = students.length === 1;
  const effectiveRate =
    group.tutorHourlyRate ??
    (isPrivate
      ? group.currentTutor.baseHourlyRate
      : group.currentTutor.baseGroupHourlyRate) ??
    0;

  // Get tutor's zoomUrl if authenticated
  const tutor = await db.tutor.findUnique({
    where: { id: input.tutorId },
    select: { zoomUrl: true },
  });
  const zoomUrl = tutor?.zoomUrl ?? null;

  const session = await db.$transaction(async (tx) => {
    if (!input.isTrial) {
      for (const student of students) {
        await decrementBalance(student.id, tx);
      }
    }

    const created = await tx.session.create({
      data: {
        startTime: startDate,
        durationMinutes: input.duration,
        groupId: input.groupId,
        tutorId: input.tutorId,
        tutorRate: effectiveRate,
        supervisorId,
        academyId: currentUser.academyId!,
        topic: input.topic,
        notes: input.notes,
        isTrial: input.isTrial ?? false,
        zoomUrl, // from tutor's profile
      },
    });

    await tx.sessionParticipant.createMany({
      data: studentIds.map((studentId) => ({
        sessionId: created.id,
        studentId,
        balanceDeducted: !input.isTrial,
      })),
    });

    return created;
  });

  revalidatePath("/ar/dashboard/sessions");
  return session;
}

export type UpdateSessionInput = {
  id: number;
  date?: string; // unused in logic, but passed from dialog
  startTime?: string; // ISO UTC
  duration?: number;
  topic?: string;
  notes?: string;
  isTrial?: boolean;
  tutorId?: number; // may override
};

export async function updateSession(input: UpdateSessionInput) {
  const existing = await db.session.findUnique({
    where: { id: input.id },
    include: { group: { select: { currentTutorId: true } } },
  });
  if (!existing) throw new Error("Session not found");

  const newStart = input.startTime
    ? dayjs.utc(input.startTime).toDate()
    : existing.startTime;
  const newDuration = input.duration ?? existing.durationMinutes;

  const data: Record<string, unknown> = {
    startTime: newStart,
    durationMinutes: newDuration,
    topic: input.topic,
    notes: input.notes,
    isTrial: input.isTrial,
  };
  if (input.tutorId !== undefined) data.tutorId = input.tutorId;

  await db.session.update({
    where: { id: input.id },
    data,
  });

  revalidatePath("/ar/dashboard/sessions");
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
      group: {
        // <-- changed
        include: {
          tutor: { include: { user: true } },
        },
      },
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
    tutorId: s.group.tutorId,
    tutorName: s.group.tutor.user.name,
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
      group: {
        // replaced tutor
        include: {
          tutor: { include: { user: { select: { name: true, phone: true } } } },
        },
      },
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
    tutorId: session.group.tutor.id,
    tutorName: session.group.tutor.user.name ?? "",
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
      group: {
        // replaced tutor
        include: {
          tutor: { include: { user: { select: { name: true } } } },
        },
      },
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
    tutorId: session.group.tutor.id,
    tutorName: session.group.tutor.user.name ?? null,
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

export async function getSessionFormOptions(academyId: number) {
  const currentUser = await user();
  if (!currentUser || currentUser.academyId !== academyId)
    throw new Error("غير مصرح");

  const [groups, tutors] = await Promise.all([
    db.group.findMany({
      where: { academyId, active: true },
      include: {
        currentTutor: {
          select: { id: true, user: { select: { name: true } } },
        },
        members: {
          where: { active: true },
          include: {
            student: {
              select: {
                id: true,
                user: { select: { name: true } },
                sessionsBalance: true,
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
    }),
    db.tutor.findMany({
      where: { academyId, active: true },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const groupOptions: SessionGroup[] = groups.map((g) => ({
    id: g.id,
    active: g.active,
    title: g.title,
    tutorId: g.currentTutor.id,
    tutorName: g.currentTutor.user.name ?? "",
    activeMembers: g.members.map((m) => ({
      id: m.student.id,
      name: m.student.user.name ?? "",
      sessionsBalance: m.student.sessionsBalance,
    })),
  }));

  const tutorOptions = tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
  }));

  return { groups: groupOptions, tutors: tutorOptions };
}
