import { describe, it, expect, beforeEach, afterEach } from "vitest";
import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import {
  seed,
  cleanupWorld,
  startTimeUtc,
  appDayOfWeek,
  firstFutureDate,
} from "./helpers/seed";
import type { TestWorld } from "./helpers/seed";
import {
  materializeRecurringSessionById,
  getRecurringSlotsForWeek,
} from "@/lib/recurringScheduling";

function saturdayOfWeek(dateStr: string): Date {
  const d = dayjs(dateStr);
  const offset = (d.day() + 1) % 7;
  return d.subtract(offset, "day").startOf("day").toDate();
}

/** A past date (strictly before today) matching the given app day-of-week. */
function pastDate(doy: number): string {
  let d = dayjs().subtract(1, "day");
  while (appDayOfWeek(d) !== doy) d = d.subtract(1, "day");
  return d.format("YYYY-MM-DD");
}

describe("materializeRecurringSessionById", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  async function makeSchedule(overrides: Partial<{ dayOfWeek: number; startTime: string; durationMinutes: number; topic: string; groupId: number; tutorId: number; endDate: Date | null; active: boolean }> = {}) {
    return db.recurringSchedule.create({
      data: {
        groupId: overrides.groupId ?? w.groupAId,
        tutorId: overrides.tutorId ?? w.tutorId,
        academyId: w.academyId,
        dayOfWeek: overrides.dayOfWeek ?? 0,
        startTime: startTimeUtc(overrides.startTime ?? "16:00"),
        durationMinutes: overrides.durationMinutes ?? 60,
        topic: overrides.topic ?? null,
        endDate: overrides.endDate === undefined ? null : overrides.endDate,
        active: overrides.active ?? true,
      },
    });
  }

  it("materializes a valid occurrence with all expected fields", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule({ topic: "المنهج الأساسي" });

    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);

    const session = await db.session.findUnique({
      where: { id: result.sessionId },
      include: { participants: true },
    });
    expect(session).not.toBeNull();
    expect(session!.recurringScheduleId).toBe(schedule.id);
    expect(session!.groupId).toBe(w.groupAId);
    expect(session!.tutorId).toBe(w.tutorId);
    expect(session!.academyId).toBe(w.academyId);
    expect(session!.durationMinutes).toBe(60);
    expect(session!.topic).toBe("المنهج الأساسي");
    expect(session!.zoomUrl).toBeNull();
    expect(session!.supervisorId).toBe(w.supervisorId);
    expect(session!.tutorRate).toBe(45); // group override

    const byStudent = new Map(session!.participants.map((p) => [p.studentId, p]));
    expect(session!.participants).toHaveLength(2);
    expect(byStudent.get(w.student1Id)!.price).toBe(25);
    expect(byStudent.get(w.student2Id)!.price).toBe(30);
  });

  it("hides the slot for the materialized date but shows other weeks", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule();
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(true);

    const weekStart = saturdayOfWeek(date);
    const slots = await getRecurringSlotsForWeek(w.academyId, weekStart);
    expect(slots.filter((s) => s.id === schedule.id)).toHaveLength(0);

    const nextWeek = dayjs(weekStart).add(7, "day").startOf("day").toDate();
    const nextSlots = await getRecurringSlotsForWeek(w.academyId, nextWeek);
    const mySlots = nextSlots.filter((s) => s.id === schedule.id);
    expect(mySlots.length).toBeGreaterThan(0);
    expect(mySlots[0].dayOfWeek).toBe(0);
    expect(mySlots[0].startTime).toBe("16:00");
  });

  it("rejects duplicate materialization on the same date", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule();
    const first = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(first.ok).toBe(true);
    const second = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("موجودة بالفعل");
  });

  it("a cancelled session still blocks re-materialization (deadlock)", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule();
    const first = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await db.session.update({
      where: { id: first.sessionId },
      data: { cancelledBy: w.admin.userId },
    });
    const again = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error).toContain("موجودة بالفعل");
  });

  it("fails when the date is skipped", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule();
    await db.recurringSchedule.update({
      where: { id: schedule.id },
      data: { skippedDates: [date] },
    });
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("متخطى");
  });

  it("fails when the occurrence is in the past", async () => {
    const date = pastDate(0);
    const schedule = await makeSchedule();
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("الماضي");
  });

  it("fails when the date does not match the schedule day", async () => {
    const date = firstFutureDate(3); // Thursday, for a Saturday schedule
    const schedule = await makeSchedule({ dayOfWeek: 0 });
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("اليوم لا يطابق");
  });

  it("fails when the schedule does not exist", async () => {
    const date = firstFutureDate(0);
    const result = await materializeRecurringSessionById(999999, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("غير موجود");
  });

  it("fails when the schedule is inactive", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule({ active: false });
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("غير موجود");
  });

  it("fails for a schedule of another academy", async () => {
    const schedule = await makeSchedule();
    const other = await seed();
    try {
      const result = await materializeRecurringSessionById(schedule.id, firstFutureDate(0), {
        academyId: other.academyId,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("غير مصرح");
    } finally {
      await cleanupWorld(other);
    }
  });

  it("fails for a schedule of another tutor (tutor scope)", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule();
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
      tutorId: w.tutor2Id,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("غير مصرح");
  });

  it("fails when the group has no active members", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule({ groupId: w.groupEmptyId });
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("لا يوجد طلاب");
  });

  it("fails when an overlapping manual session exists", async () => {
    const date = firstFutureDate(0);
    const schedule = await makeSchedule();
    const target = dayjs(date);
    const offset = (target.day() + 1) % 7;
    const weekSat = target.subtract(offset, "day");
    // Place a manual session at the same wall-clock time on the same date.
    const conflictStart = dayjs(`${date}T15:30:00`).toDate();

    await db.session.create({
      data: {
        startTime: conflictStart,
        durationMinutes: 120, // 15:30-17:30 covers 16:00-17:00
        groupId: w.groupBId,
        tutorId: w.tutorId, // same tutor conflicts
        tutorRate: 0,
        academyId: w.academyId,
      },
    });
    void weekSat;
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("تعارض");
  });

  it("fails when the schedule is expired (endDate in the past)", async () => {
    const schedule = await makeSchedule({
      endDate: dayjs().subtract(10, "day").toDate(),
    });
    const date = firstFutureDate(0);
    const result = await materializeRecurringSessionById(schedule.id, date, {
      academyId: w.academyId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("انتهى الجدول");
  });
});