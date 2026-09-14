"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import dayjs from "@/lib/dayjs";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import { withResult, fail } from "@/lib/action-result";
import { getAcademySchedulingSettings } from "@/lib/academySettings";
import {
  materializeRecurringSessionById,
} from "@/lib/recurringScheduling";

const RECURRING_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const RECURRING_PATHS = [
  "/ar/dashboard/sessions",
  "/ar/dashboard/tutor/sessions",
  "/ar/dashboard/supervisor/sessions",
  "/ar/dashboard/timetable",
  "/ar/dashboard/tutor/timetable",
  "/ar/dashboard/supervisor/timetable",
];

function revalidateRecurringPaths() {
  for (const p of RECURRING_PATHS) revalidatePath(p);
}

function validTime(time: string): boolean {
  return RECURRING_TIME_RE.test(time);
}

function validDuration(minutes: number): boolean {
  return Number.isFinite(minutes) && minutes >= 15 && minutes <= 480;
}

type CreateRecurringScheduleInput = {
  groupId: number;
  tutorId: number;
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  durationMinutes?: number;
  topic?: string;
  endDate?: string | null;
};

export const createRecurringSchedule = withResult(
  async (input: CreateRecurringScheduleInput) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId) return fail("غير مصرح");

    if (currentUser.role === Role.Tutor) {
      const tutor = await db.tutor.findUnique({
        where: { userId: currentUser.id },
        select: { id: true },
      });
      if (input.tutorId !== tutor?.id) {
        return fail("غير مصرح: يمكنك فقط إضافة حصص لنفسك");
      }
      const settings = await getAcademySchedulingSettings(
        currentUser.academyId,
      );
      if (!settings.tutorsCanCreateSessions) {
        return fail("غير مصرح: إضافة الحصص غير متاحة لك");
      }
    }

    if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
      return fail("يوم غير صحيح");
    }
    if (!validTime(input.startTime)) {
      return fail("وقت البدء غير صحيح");
    }
    if (input.durationMinutes && !validDuration(input.durationMinutes)) {
      return fail("المدة يجب أن تكون بين 15 و 480 دقيقة");
    }

    const group = await db.group.findUnique({
      where: { id: input.groupId },
      select: { id: true, academyId: true, currentTutorId: true },
    });
    if (!group || group.academyId !== currentUser.academyId) {
      return fail("المجموعة غير موجودة");
    }

    const [hours, minutes] = input.startTime.split(":").map(Number);
    const startTimeUtc = dayjs
      .utc()
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0)
      .toDate();

    const existing = await db.recurringSchedule.findFirst({
      where: {
        groupId: input.groupId,
        dayOfWeek: input.dayOfWeek,
        startTime: startTimeUtc,
        active: true,
      },
    });
    if (existing) {
      return fail("يوجد جدول متكرر مماثل لهذا اليوم والوقت");
    }

    await db.recurringSchedule.create({
      data: {
        groupId: input.groupId,
        tutorId: input.tutorId,
        academyId: currentUser.academyId,
        dayOfWeek: input.dayOfWeek,
        startTime: startTimeUtc,
        durationMinutes: input.durationMinutes ?? 60,
        topic: input.topic ?? null,
        endDate: input.endDate
          ? dayjs(input.endDate).endOf("day").toDate()
          : null,
      },
    });

    revalidateRecurringPaths();
  },
);

type UpdateRecurringScheduleInput = {
  id: number;
  dayOfWeek?: number;
  startTime?: string;
  durationMinutes?: number;
  topic?: string;
  endDate?: string | null;
  active?: boolean;
};

export const updateRecurringSchedule = withResult(
  async (input: UpdateRecurringScheduleInput) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId) return fail("غير مصرح");

    const existing = await db.recurringSchedule.findUnique({
      where: { id: input.id },
    });
    if (!existing || existing.academyId !== currentUser.academyId) {
      return fail("الجدول غير موجود");
    }

    if (currentUser.role === Role.Tutor) {
      const tutor = await db.tutor.findUnique({
        where: { userId: currentUser.id },
        select: { id: true },
      });
      if (existing.tutorId !== tutor?.id) {
        return fail("غير مصرح");
      }
      const settings = await getAcademySchedulingSettings(
        currentUser.academyId,
      );
      if (!settings.tutorsCanCreateSessions) {
        return fail("غير مصرح: إضافة الحصص غير متاحة لك");
      }
    }

    if (input.dayOfWeek !== undefined && (input.dayOfWeek < 0 || input.dayOfWeek > 6)) {
      return fail("يوم غير صحيح");
    }
    if (input.startTime !== undefined && !validTime(input.startTime)) {
      return fail("وقت البدء غير صحيح");
    }
    if (input.durationMinutes !== undefined && !validDuration(input.durationMinutes)) {
      return fail("المدة يجب أن تكون بين 15 و 480 دقيقة");
    }

    const data: Record<string, unknown> = {};
    if (input.dayOfWeek !== undefined) data.dayOfWeek = input.dayOfWeek;
    if (input.durationMinutes !== undefined)
      data.durationMinutes = input.durationMinutes;
    if (input.topic !== undefined) data.topic = input.topic ?? null;
    if (input.active !== undefined) data.active = input.active;
    if (input.endDate !== undefined) {
      data.endDate = input.endDate
        ? dayjs(input.endDate).endOf("day").toDate()
        : null;
    }
    if (input.startTime !== undefined) {
      const [hours, minutes] = input.startTime.split(":").map(Number);
      data.startTime = dayjs
        .utc()
        .hour(hours)
        .minute(minutes)
        .second(0)
        .millisecond(0)
        .toDate();
    }

    const nextDay = (input.dayOfWeek ?? existing.dayOfWeek);
    const nextStartTime = (data.startTime as Date | undefined) ?? existing.startTime;
    const conflicting = await db.recurringSchedule.findFirst({
      where: {
        id: { not: input.id },
        groupId: existing.groupId,
        dayOfWeek: nextDay,
        startTime: nextStartTime,
        active: true,
      },
      select: { id: true },
    });
    if (conflicting) {
      return fail("يوجد جدول متكرر مماثل لهذا اليوم والوقت");
    }

    await db.recurringSchedule.update({
      where: { id: input.id },
      data,
    });

    revalidateRecurringPaths();
  },
);

export const deleteRecurringSchedule = withResult(async (id: number) => {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) return fail("غير مصرح");

  const existing = await db.recurringSchedule.findUnique({
    where: { id },
  });
  if (!existing || existing.academyId !== currentUser.academyId) {
    return fail("الجدول غير موجود");
  }

  await db.recurringSchedule.update({
    where: { id },
    data: { active: false },
  });

  revalidateRecurringPaths();
});

export const getRecurringSchedules = withResult(
  async (academyId: number, groupId?: number) => {
    const currentUser = await user();
    if (!currentUser || currentUser.academyId !== academyId) {
      return fail("غير مصرح");
    }

    const where: Record<string, unknown> = {
      academyId,
      active: true,
    };
    if (groupId) where.groupId = groupId;

    if (currentUser.role === Role.Tutor) {
      const tutor = await db.tutor.findUnique({
        where: { userId: currentUser.id },
        select: { id: true },
      });
      if (tutor) where.tutorId = tutor.id;
    }

    const schedules = await db.recurringSchedule.findMany({
      where,
      include: {
        group: { select: { title: true } },
        tutor: { select: { user: { select: { name: true } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return schedules;
  },
);

export const skipRecurringDate = withResult(
  async (scheduleId: number, date: string) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId) return fail("غير مصرح");

    const schedule = await db.recurringSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule || schedule.academyId !== currentUser.academyId) {
      return fail("الجدول غير موجود");
    }

    const currentSkipped = (schedule.skippedDates as string[]) ?? [];
    if (currentSkipped.includes(date)) {
      return fail("هذا التاريخ متخطى بالفعل");
    }

    await db.recurringSchedule.update({
      where: { id: scheduleId },
      data: {
        skippedDates: [...currentSkipped, date],
      },
    });

    revalidateRecurringPaths();
  },
);

export const unskipRecurringDate = withResult(
  async (scheduleId: number, date: string) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId) return fail("غير مصرح");

    const schedule = await db.recurringSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule || schedule.academyId !== currentUser.academyId) {
      return fail("الجدول غير موجود");
    }

    const currentSkipped = (schedule.skippedDates as string[]) ?? [];
    await db.recurringSchedule.update({
      where: { id: scheduleId },
      data: {
        skippedDates: currentSkipped.filter((d) => d !== date),
      },
    });

    revalidateRecurringPaths();
  },
);

/**
 * Click-to-materialize a recurring slot into a real session.
 */
export const materializeRecurringSession = withResult(
  async (scheduleId: number, date: string) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId) return fail("غير مصرح");

    let tutorId: number | undefined;
    if (currentUser.role === Role.Tutor) {
      const tutor = await db.tutor.findUnique({
        where: { userId: currentUser.id },
        select: { id: true },
      });
      if (!tutor) return fail("غير مصرح");
      tutorId = tutor.id;
      const settings = await getAcademySchedulingSettings(
        currentUser.academyId,
      );
      if (!settings.tutorsCanCreateSessions) {
        return fail("غير مصرح: إضافة الحصص غير متاحة لك");
      }
    }

    const result = await materializeRecurringSessionById(scheduleId, date, {
      academyId: currentUser.academyId,
      tutorId,
    });
    if (!result.ok) return fail(result.error);

    revalidateRecurringPaths();
    return { sessionId: result.sessionId };
  },
);