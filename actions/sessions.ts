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

type CreateSessionInput = {
  studentId: number;
  tutorId: number;
  academyId: number;
  date: string;
  startTime: string;
  duration: number;
  topic?: string;
  notes?: string;
  isRecurring: boolean;
  recurDays?: number[];
  recurEndDate?: string;
  isTrial?: boolean;
};

type UpdateSessionInput = Partial<CreateSessionInput> & {
  id: number;
  scope?: "this" | "future" | "all";
};

export async function createSession(input: CreateSessionInput) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const start = dayjs(`${input.date}T${input.startTime}`);
  const startDate = start.toDate();
  const endDate = dayjs(start).add(input.duration, "minute").toDate();

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
    throw new Error("Conflict detected");
  }
  const student = await db.student.findUnique({
    where: { id: input.studentId },
  });
  if (!student) throw new Error("هذا الطالب غير موجود");

  if (input.isTrial && student.status !== StudentStatus.trial) {
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
      payload.id,
      payload.academyId,
    );
  }

  if (!input.isRecurring) {
    const session = await db.session.create({
      data: {
        startTime: startDate,
        endTime: endDate,
        durationMinutes: input.duration,
        studentId: input.studentId,
        tutorId: input.tutorId,
        academyId: payload.academyId,
        topic: input.topic,
        notes: input.notes,
      },
    });
    revalidatePath("/ar/dashboard/sessions");
    return session;
  } else {
    // Recurring pattern
    const pattern = await db.recurringPattern.create({
      data: {
        daysOfWeek: input.recurDays!,
        startTime: startDate,
        durationMinutes: input.duration,
        startDate: dayjs.utc(start).startOf("day").toDate(),
        endDate: input.recurEndDate
          ? dayjs.utc(input.recurEndDate).endOf("day").toDate()
          : null,
        studentId: input.studentId,
        tutorId: input.tutorId,
        academyId: input.academyId,
      },
    });

    const recurEndDate = input.recurEndDate
      ? dayjs.utc(input.recurEndDate).endOf("day")
      : start.add(6, "month");

    let current = start;
    const sessionsToCreate = [];

    while (
      current.isBefore(recurEndDate) ||
      current.isSame(recurEndDate, "day")
    ) {
      if (input.recurDays!.includes(current.day())) {
        const sessionStart = current.toDate();
        const sessionEnd = dayjs
          .utc(sessionStart)
          .add(input.duration, "minute")
          .toDate();
        sessionsToCreate.push({
          startTime: sessionStart,
          endTime: sessionEnd,
          durationMinutes: input.duration,
          studentId: input.studentId,
          tutorId: input.tutorId,
          academyId: input.academyId,
          topic: input.topic,
          notes: input.notes,
          status: SessionStatus.SCHEDULED,
          recurringPatternId: pattern.id,
        });
      }
      current = current.add(1, "day");
    }

    await db.session.createMany({ data: sessionsToCreate });
    revalidatePath("/ar/dashboard/sessions");
    return pattern;
  }
}

export async function updateSession(input: UpdateSessionInput) {
  const existing = await db.session.findUnique({
    where: { id: input.id },
    include: { recurringPattern: true },
  });
  if (!existing) throw new Error("Session not found");

  // If it's a recurring session and scope is not 'this', we need to handle pattern updates
  if (existing.recurringPatternId && input.scope !== "this") {
    // For simplicity, we'll handle 'future' by deleting future instances and recreating
    // For 'all', we update the pattern and all instances
    // This is complex; we'll implement a basic version
    // For now, we'll only allow editing single instances
    throw new Error(
      "Editing recurring sessions with scope is not yet implemented",
    );
  }

  // Single session update
  const newStart = input.startTime
    ? dayjs(input.startTime).toDate()
    : existing.startTime;
  const newEnd = input.duration
    ? dayjs(newStart).add(input.duration, "minute").toDate()
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

  revalidatePath("/ar/dashboard/sessions");
  return updated;
}

export async function deleteSession(
  id: number,
  scope: "this" | "future" | "series",
) {
  const session = await db.session.findUnique({
    where: { id },
    include: { recurringPattern: true },
  });
  if (!session) throw new Error("Session not found");

  if (session.recurringPatternId && scope !== "this") {
    if (scope === "series") {
      // Delete all sessions in the pattern (and their attendances)
      const sessionsToDelete = await db.session.findMany({
        where: { recurringPatternId: session.recurringPatternId },
        select: { id: true },
      });
      // Delete attendances first
      for (const s of sessionsToDelete) {
        await db.attendance.deleteMany({ where: { sessionId: s.id } });
      }
      // Delete all sessions
      await db.session.deleteMany({
        where: { recurringPatternId: session.recurringPatternId },
      });
      // Delete the pattern
      await db.recurringPattern.delete({
        where: { id: session.recurringPatternId },
      });
    } else if (scope === "future") {
      // Delete this and all future sessions of the same pattern
      const futureSessions = await db.session.findMany({
        where: {
          recurringPatternId: session.recurringPatternId,
          startTime: { gte: session.startTime },
        },
        select: { id: true },
      });
      // Delete attendances
      for (const s of futureSessions) {
        await db.attendance.deleteMany({ where: { sessionId: s.id } });
      }
      // Delete future sessions
      await db.session.deleteMany({
        where: {
          recurringPatternId: session.recurringPatternId,
          startTime: { gte: session.startTime },
        },
      });
      // If no sessions left, delete the pattern
      const remaining = await db.session.count({
        where: { recurringPatternId: session.recurringPatternId },
      });
      if (remaining === 0) {
        await db.recurringPattern.delete({
          where: { id: session.recurringPatternId },
        });
      }
    }
  } else {
    // Single session: delete attendance then session
    await db.attendance.deleteMany({ where: { sessionId: id } });
    await db.session.delete({ where: { id } });
  }

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
      student: true,
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
    studentName: s.student.name,
    tutorId: s.tutorId,
    tutorName: s.tutor.user.name,
    recurringPatternId: s.recurringPatternId,
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
