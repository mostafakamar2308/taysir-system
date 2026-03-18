"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { localToUTC } from "@/lib/dates";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { Role } from "@/types/user";

dayjs.extend(utc);

type CreateSessionInput = {
  studentId: number;
  tutorId: number;
  academyId: number; // from context
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  duration: number;
  topic?: string;
  notes?: string;
  isRecurring: boolean;
  recurDays?: number[]; // 0-6
  recurEndDate?: string; // YYYY-MM-DD
};

type UpdateSessionInput = Partial<CreateSessionInput> & {
  id: number;
  scope?: "this" | "future" | "all";
};

export async function createSession(input: CreateSessionInput) {
  // Convert local date+time to UTC
  const startUTC = localToUTC(input.date, input.startTime);
  const endUTC = dayjs.utc(startUTC).add(input.duration, "minute").toDate();

  // Basic conflict check (tutor and student)
  const conflicts = await db.session.findMany({
    where: {
      OR: [{ tutorId: input.tutorId }, { studentId: input.studentId }],
      startTime: { lt: endUTC },
      endTime: { gt: startUTC },
      status: { not: SessionStatus.CANCELLED },
    },
    include: { tutor: { include: { user: true } }, student: true },
  });

  if (conflicts.length > 0) {
    // You can return a structured error
    throw new Error("Conflict detected");
  }

  if (!input.isRecurring) {
    // Single session
    const session = await db.session.create({
      data: {
        startTime: startUTC,
        endTime: endUTC,
        durationMinutes: input.duration,
        studentId: input.studentId,
        tutorId: input.tutorId,
        academyId: input.academyId,
        topic: input.topic,
        notes: input.notes,
        status: SessionStatus.SCHEDULED,
      },
    });
    revalidatePath("/dashboard/sessions");
    return session;
  } else {
    // Recurring pattern
    const pattern = await db.recurringPattern.create({
      data: {
        daysOfWeek: input.recurDays!,
        startTime: startUTC, // we store the time part (date will be ignored later)
        durationMinutes: input.duration,
        startDate: dayjs.utc(startUTC).startOf("day").toDate(),
        endDate: input.recurEndDate
          ? dayjs.utc(input.recurEndDate).endOf("day").toDate()
          : null,
        studentId: input.studentId,
        tutorId: input.tutorId,
        academyId: input.academyId,
      },
    });

    const start = dayjs.utc(startUTC);
    const end = input.recurEndDate
      ? dayjs.utc(input.recurEndDate).endOf("day")
      : start.add(6, "month");

    let current = start;
    const sessionsToCreate = [];

    while (current.isBefore(end) || current.isSame(end, "day")) {
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
    revalidatePath("/dashboard/sessions");
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
  const newStart =
    input.date && input.startTime
      ? localToUTC(input.date, input.startTime)
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

  revalidatePath("/dashboard/sessions");
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
      // Delete pattern and all linked sessions
      await db.recurringPattern.delete({
        where: { id: session.recurringPatternId },
      });
    } else if (scope === "future") {
      // Delete this and all future sessions of the same pattern
      await db.session.deleteMany({
        where: {
          recurringPatternId: session.recurringPatternId,
          startTime: { gte: session.startTime },
        },
      });
      // If no sessions left, optionally delete pattern
    }
  } else {
    await db.session.delete({ where: { id } });
  }

  revalidatePath("/dashboard/sessions");
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
      studentAttendanceStatus: role === Role.Tutor ? undefined : status,
      tutorAttendanceStatus: role === Role.Tutor ? status : undefined,
      reason,
    },
    create: {
      sessionId,
      studentAttendanceStatus: status,
      tutorAttendanceStatus: status,
      reason,
    },
  });

  // Also update session status if needed
  if (status === AttendanceStatus.ATTENDED) {
    await db.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.COMPLETED },
    });
  } else if (status === AttendanceStatus.CANCELLED) {
    await db.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.CANCELLED },
    });
  }

  revalidatePath("/dashboard/sessions");
  return attendance;
}

export async function getSessionsForWeek(startDate: Date, endDate: Date) {
  const sessions = await db.session.findMany({
    where: {
      startTime: { gte: startDate, lt: endDate },
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
    status: s.status, // convert to lowercase for UI
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
