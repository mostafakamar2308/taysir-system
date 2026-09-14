import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { localToUTC } from "@/lib/dates";
import type { Prisma } from "@/generated/prisma/client";
import type { RecurringScheduleSlot } from "@/types/session";

const scheduleInclude = {
  group: {
    include: {
      members: {
        where: { active: true },
        include: { student: { include: { user: true } } },
      },
      currentTutor: {
        select: {
          id: true,
          defaultSupervisorId: true,
          baseHourlyRate: true,
          baseGroupHourlyRate: true,
        },
      },
    },
  },
  tutor: {
    select: {
      id: true,
      zoomUrl: true,
      baseHourlyRate: true,
      baseGroupHourlyRate: true,
    },
  },
} satisfies Prisma.RecurringScheduleInclude;

type ScheduleWithFull = Prisma.RecurringScheduleGetPayload<{
  include: typeof scheduleInclude;
}>;

export type MaterializationResult =
  | { ok: true; sessionId: number }
  | { ok: false; error: string };

/**
 * App day-of-week convention: 0=Saturday ... 6=Friday.
 * dayjs .day() returns 0=Sunday ... 6=Saturday, so shift by +1 mod 7.
 */
export function appDayOfWeek(date: Date | dayjs.Dayjs): number {
  return (dayjs(date).day() + 1) % 7;
}

/** Read the wall-clock HH:mm of a schedule (startTime is stored as literal UTC). */
export function scheduleWallClock(
  schedule: { startTime: Date },
): { hour: number; minute: number } {
  const t = dayjs.utc(schedule.startTime);
  return { hour: t.hour(), minute: t.minute() };
}

function isExpired(schedule: { endDate: Date | null }): boolean {
  return schedule.endDate
    ? dayjs(schedule.endDate).isBefore(dayjs(), "day")
    : false;
}

/**
 * Next upcoming occurrence (YYYY-MM-DD) for a schedule, or null when it is
 * expired, fully skipped or beyond the scanned horizon.
 */
export function getNextOccurrence(schedule: {
  dayOfWeek: number;
  endDate: Date | null;
  skippedDates: unknown;
}): string | null {
  if (isExpired(schedule)) return null;
  const skippedDates = (schedule.skippedDates as string[]) ?? [];
  for (let i = 0; i < 60; i++) {
    const d = dayjs().add(i, "day");
    if (appDayOfWeek(d) !== schedule.dayOfWeek) continue;
    const dateStr = d.format("YYYY-MM-DD");
    if (skippedDates.includes(dateStr)) continue;
    if (schedule.endDate && d.isAfter(dayjs(schedule.endDate), "day"))
      return null;
    return dateStr;
  }
  return null;
}

async function loadSchedule(
  scheduleId: number,
): Promise<ScheduleWithFull | null> {
  return db.recurringSchedule.findUnique({
    where: { id: scheduleId },
    include: scheduleInclude,
  });
}

/**
 * Materialize a single schedule occurrence on `date` (YYYY-MM-DD).
 * Shared by the manual click action and the nightly cron.
 */
export async function materializeScheduleOnDate(
  schedule: ScheduleWithFull,
  date: string,
): Promise<MaterializationResult> {
  const skippedDates = (schedule.skippedDates as string[]) ?? [];

  if (isExpired(schedule)) return { ok: false, error: "انتهى الجدول المتكرر" };
  if (skippedDates.includes(date)) {
    return { ok: false, error: "هذا التاريخ متخطى" };
  }

  const targetDate = dayjs(date);
  if (appDayOfWeek(targetDate) !== schedule.dayOfWeek) {
    return { ok: false, error: "اليوم لا يطابق الجدول المتكرر" };
  }

  const clock = scheduleWallClock(schedule);
  const timeStr = `${clock.hour.toString().padStart(2, "0")}:${clock.minute
    .toString()
    .padStart(2, "0")}`;
  const targetStartTime = localToUTC(date, timeStr);

  if (targetStartTime.getTime() <= Date.now()) {
    return { ok: false, error: "لا يمكن إنشاء حصة في الماضي" };
  }

  const existingSession = await db.session.findFirst({
    where: {
      recurringScheduleId: schedule.id,
      startTime: {
        gte: dayjs(targetStartTime).startOf("day").toDate(),
        lte: dayjs(targetStartTime).endOf("day").toDate(),
      },
    },
    select: { id: true },
  });
  if (existingSession) return { ok: false, error: "هذه الحصة موجودة بالفعل" };

  const group = schedule.group;
  if (group.members.length === 0) {
    return { ok: false, error: "لا يوجد طلاب في المجموعة" };
  }

  const studentIds = group.members.map((m) => m.student.id);
  const computedEnd = dayjs(targetStartTime)
    .add(schedule.durationMinutes, "minute")
    .toDate();

  const conflicts = await db.session.findMany({
    where: {
      OR: [
        { tutorId: schedule.tutorId },
        { participants: { some: { studentId: { in: studentIds } } } },
      ],
      startTime: { lt: computedEnd },
      cancelledBy: null,
    },
    select: { startTime: true, durationMinutes: true },
  });

  const overlapping = conflicts.filter((s) => {
    const sEnd = dayjs(s.startTime).add(s.durationMinutes, "minute").toDate();
    return sEnd > targetStartTime;
  });
  if (overlapping.length > 0) {
    return { ok: false, error: "تعارض في المواعيد مع هذه الحصة" };
  }

  const supervisorId =
    group.currentTutor.defaultSupervisorId ??
    (
      await db.supervisor.findFirst({
        where: { academyId: schedule.academyId, active: true },
        select: { id: true },
      })
    )?.id ??
    null;

  const isPrivate = group.members.length === 1;
  const effectiveRate =
    group.tutorHourlyRate ??
    (isPrivate
      ? group.currentTutor.baseHourlyRate
      : group.currentTutor.baseGroupHourlyRate) ??
    0;

  // Auto-materialized sessions start without a meeting link; it's added later.
  const zoomUrl: string | null = null;

  const priceByStudent = new Map<number, number>();
  for (const m of group.members) {
    priceByStudent.set(
      m.studentId,
      m.customSessionPrice ?? group.studentSessionPrice ?? 0,
    );
  }
  const defaultPrice = group.studentSessionPrice ?? 0;

  const session = await db.$transaction(async (tx) => {
    const created = await tx.session.create({
      data: {
        startTime: targetStartTime,
        durationMinutes: schedule.durationMinutes,
        groupId: group.id,
        tutorId: schedule.tutorId,
        tutorRate: effectiveRate,
        supervisorId,
        academyId: schedule.academyId,
        topic: schedule.topic,
        zoomUrl,
        recurringScheduleId: schedule.id,
      },
    });

    await tx.sessionParticipant.createMany({
      data: studentIds.map((studentId) => ({
        sessionId: created.id,
        studentId,
        price: priceByStudent.get(studentId) ?? defaultPrice,
        paymentStatus: 0,
      })),
    });

    return created;
  });

  return { ok: true, sessionId: session.id };
}

/** Manual materialization used by the click-to-create action. */
export async function materializeRecurringSessionById(
  scheduleId: number,
  date: string,
  opts?: { academyId?: number; tutorId?: number },
): Promise<MaterializationResult> {
  const schedule = await loadSchedule(scheduleId);
  if (!schedule || !schedule.active) {
    return { ok: false, error: "الجدول غير موجود" };
  }
  if (opts?.academyId != null && schedule.academyId !== opts.academyId) {
    return { ok: false, error: "غير مصرح" };
  }
  if (opts?.tutorId != null && schedule.tutorId !== opts.tutorId) {
    return { ok: false, error: "غير مصرح" };
  }
  return materializeScheduleOnDate(schedule, date);
}

/**
 * Nightly cron engine: materialize occurrences of all active schedules for the
 * next `days` days. Occurrences that fail validation (past, skipped, conflict,
 * empty group, ...) are silently skipped.
 */
export async function materializeAllUpcoming(
  days = 7,
): Promise<{ created: number }> {
  const now = dayjs.utc();

  const schedules = await db.recurringSchedule.findMany({
    where: {
      active: true,
      OR: [{ endDate: null }, { endDate: { gte: now.toDate() } }],
    },
    include: scheduleInclude,
  });

  let createdCount = 0;

  for (const schedule of schedules) {
    const skippedDates = (schedule.skippedDates as string[]) ?? [];
    for (let i = 0; i < days; i++) {
      const targetDate = now.add(i, "day");
      if (appDayOfWeek(targetDate) !== schedule.dayOfWeek) continue;

      const dateStr = targetDate.format("YYYY-MM-DD");
      if (skippedDates.includes(dateStr)) continue;

      const result = await materializeScheduleOnDate(schedule, dateStr);
      if (result.ok) createdCount += 1;
    }
  }

  return { created: createdCount };
}

/**
 * Compute the recurring slots for a given week (Saturday start).
 * A slot is hidden when a real session (any status) already exists for that date.
 */
export async function getRecurringSlotsForWeek(
  academyId: number,
  weekStart: Date,
  tutorId?: number,
  supervisorId?: number,
): Promise<RecurringScheduleSlot[]> {
  const weekEnd = dayjs(weekStart).add(6, "day").endOf("day").toDate();

  const where: Record<string, unknown> = {
    academyId,
    active: true,
  };
  if (tutorId) where.tutorId = tutorId;
  if (supervisorId) {
    where.tutor = { defaultSupervisorId: supervisorId };
  }

  const schedules = await db.recurringSchedule.findMany({
    where,
    include: {
      group: {
        select: {
          title: true,
          members: {
            where: { active: true },
            select: { id: true },
          },
        },
      },
      tutor: { select: { user: { select: { name: true } } } },
      sessions: {
        where: {
          startTime: { gte: weekStart, lte: weekEnd },
        },
        select: { startTime: true },
      },
    },
  });

  const slots: RecurringScheduleSlot[] = [];

  for (const schedule of schedules) {
    if (isExpired(schedule)) continue;
    if (schedule.group.members.length === 0) continue;

    const skippedDates = (schedule.skippedDates as string[]) ?? [];
    const clock = scheduleWallClock(schedule);
    const timeStr = `${clock.hour.toString().padStart(2, "0")}:${clock.minute
      .toString()
      .padStart(2, "0")}`;

    for (let i = 0; i < 7; i++) {
      const targetDate = dayjs(weekStart).add(i, "day");
      if (appDayOfWeek(targetDate) !== schedule.dayOfWeek) continue;

      const dateStr = targetDate.format("YYYY-MM-DD");
      if (skippedDates.includes(dateStr)) continue;

      // Hide slots that are already in the past (matching the materialization
      // rule). When a real session exists we never reach this point anyway.
      const targetStart = localToUTC(dateStr, timeStr);
      if (targetStart.getTime() <= Date.now()) continue;

      const hasRealSession = schedule.sessions.some((s) => {
        const sDate = dayjs(s.startTime);
        return (
          sDate.year() === targetDate.year() &&
          sDate.month() === targetDate.month() &&
          sDate.date() === targetDate.date()
        );
      });
      if (hasRealSession) continue;

      slots.push({
        id: schedule.id,
        groupId: schedule.groupId,
        groupName: schedule.group.title,
        tutorId: schedule.tutorId,
        tutorName: schedule.tutor.user.name ?? "",
        dayOfWeek: schedule.dayOfWeek,
        startTime: timeStr,
        durationMinutes: schedule.durationMinutes,
        topic: schedule.topic,
        nextOccurrence: dateStr,
        isSkipped: false,
      });
    }
  }

  return slots;
}