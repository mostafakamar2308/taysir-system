import { describe, it, expect, beforeEach, afterEach } from "vitest";
import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import {
  seed,
  cleanupWorld,
} from "./helpers/seed";
import type { TestWorld } from "./helpers/seed";
import {
  createRecurringSchedule,
  updateRecurringSchedule,
  deleteRecurringSchedule,
  skipRecurringDate,
  unskipRecurringDate,
  getRecurringSchedules,
} from "@/actions/recurringSchedule";

describe("createRecurringSchedule", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  it("creates a schedule with defaults", async () => {
    const res = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0, // Saturday
      startTime: "16:00",
    });
    expect(res.ok).toBe(true);

    const s = await db.recurringSchedule.findFirstOrThrow({
      where: { groupId: w.groupAId },
    });
    expect(s.dayOfWeek).toBe(0);
    expect(s.durationMinutes).toBe(60);
    expect(s.active).toBe(true);
    expect(s.endDate).toBeNull();
    expect(dayjs.utc(s.startTime).hour()).toBe(16);
    expect(dayjs.utc(s.startTime).minute()).toBe(0);
  });

  it("stores endDate at end of day", async () => {
    const res = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 1,
      startTime: "10:00",
      durationMinutes: 45,
      topic: "منهج",
      endDate: "2026-12-31",
    });
    expect(res.ok).toBe(true);
    const s = await db.recurringSchedule.findFirstOrThrow({
      where: { groupId: w.groupAId, dayOfWeek: 1 },
    });
    expect(s.durationMinutes).toBe(45);
    expect(s.topic).toBe("منهج");
    expect(s.endDate!.getTime()).toBe(
      dayjs("2026-12-31").endOf("day").toDate().getTime(),
    );
  });

  it("rejects invalid dayOfWeek", async () => {
    for (const dov of [-1, 7]) {
      const res = await createRecurringSchedule({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        dayOfWeek: dov,
        startTime: "10:00",
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("يوم غير صحيح");
    }
  });

  it("rejects invalid time format", async () => {
    const res = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "25:00",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("وقت البدء غير صحيح");
  });

  it("rejects out-of-range duration", async () => {
    const res = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "10:00",
      durationMinutes: 500,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("المدة");
  });

  it("rejects non-existent group", async () => {
    const res = await createRecurringSchedule({
      groupId: 999999,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "10:00",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("المجموعة غير موجودة");
  });

  it("rejects a group from another academy", async () => {
    const other = await seed();
    try {
      const res = await createRecurringSchedule({
        groupId: other.groupAId,
        tutorId: w.tutorId,
        dayOfWeek: 0,
        startTime: "10:00",
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("المجموعة غير موجودة");
    } finally {
      await cleanupWorld(other);
    }
  });

  it("rejects an exact duplicate (group/day/time)", async () => {
    const input = {
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "16:00",
      durationMinutes: 60,
    };
    const first = await createRecurringSchedule(input);
    expect(first.ok).toBe(true);
    const second = await createRecurringSchedule(input);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("جدول متكرر مماثل");
  });

  it("allows the same group at different times", async () => {
    const a = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "10:00",
    });
    expect(a.ok).toBe(true);
    const b = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "12:00",
    });
    expect(b.ok).toBe(true);
  });

  describe("auth & roles", () => {
    it("blocks tutor when settings disallow creation", async () => {
      await db.academySettings.update({
        where: { academyId: w.academyId },
        data: { tutorsCanCreateSessions: false },
      });
      w.loginAs(w.tutor);
      const res = await createRecurringSchedule({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        dayOfWeek: 0,
        startTime: "10:00",
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("إضافة الحصص غير متاحة لك");
    });

    it("tutor can create for themselves when allowed", async () => {
      w.loginAs(w.tutor);
      const res = await createRecurringSchedule({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        dayOfWeek: 0,
        startTime: "10:00",
      });
      expect(res.ok).toBe(true);
    });

    it("tutor cannot create for another tutor", async () => {
      w.loginAs(w.tutor);
      const res = await createRecurringSchedule({
        groupId: w.groupAId,
        tutorId: w.tutor2Id,
        dayOfWeek: 0,
        startTime: "10:00",
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("يمكنك فقط إضافة حصص لنفسك");
    });
  });
});

describe("updateRecurringSchedule", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  async function makeSchedule(dayOfWeek = 0, startTime = "10:00") {
    const res = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek,
      startTime,
    });
    if (!res.ok) throw new Error("failed to create schedule: " + res.error);
    return db.recurringSchedule.findFirstOrThrow({
      where: { groupId: w.groupAId, dayOfWeek, active: true },
    });
  }

  it("updates day, time, duration, topic and endDate", async () => {
    const s = await makeSchedule();
    const res = await updateRecurringSchedule({
      id: s.id,
      dayOfWeek: 3,
      startTime: "14:30",
      durationMinutes: 90,
      topic: "updated",
      endDate: "2027-01-01",
    });
    expect(res.ok).toBe(true);
    const updated = await db.recurringSchedule.findUnique({ where: { id: s.id } });
    expect(updated!.dayOfWeek).toBe(3);
    expect(dayjs.utc(updated!.startTime).hour()).toBe(14);
    expect(updated!.durationMinutes).toBe(90);
    expect(updated!.topic).toBe("updated");
    expect(updated!.endDate!.getTime()).toBe(
      dayjs("2027-01-01").endOf("day").toDate().getTime(),
    );
  });

  it("rejects an update that collides with another active schedule", async () => {
    await makeSchedule(0, "10:00");
    const s2 = await makeSchedule(1, "12:00");
    const res = await updateRecurringSchedule({
      id: s2.id,
      dayOfWeek: 0,
      startTime: "10:00",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("جدول متكرر مماثل");
  });

  it("allows updating to a non-conflicting slot", async () => {
    await makeSchedule(0, "10:00");
    const s2 = await makeSchedule(1, "12:00");
    const res = await updateRecurringSchedule({
      id: s2.id,
      dayOfWeek: 0,
      startTime: "11:00",
    });
    expect(res.ok).toBe(true);
  });

  it("rejects non-existent schedule", async () => {
    const res = await updateRecurringSchedule({ id: 999999, topic: "x" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("الجدول غير موجود");
  });

  it("rejects schedule from another academy", async () => {
    const s = await makeSchedule();
    const other = await seed();
    try {
      other.loginAs(other.admin);
      const res = await updateRecurringSchedule({ id: s.id, topic: "hacked" });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("الجدول غير موجود");
    } finally {
      await cleanupWorld(other);
    }
  });

  it("tutor can only update their own timetable", async () => {
    w.loginAs(w.tutor);
    const mine = await makeSchedule(0, "10:00");
    const res = await updateRecurringSchedule({ id: mine.id, topic: "mine" });
    expect(res.ok).toBe(true);
  });
});

describe("deleteRecurringSchedule", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  it("soft-deletes (active=false)", async () => {
    const res = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "10:00",
    });
    expect(res.ok).toBe(true);
    const s = await db.recurringSchedule.findFirstOrThrow({
      where: { groupId: w.groupAId },
    });
    const del = await deleteRecurringSchedule(s.id);
    expect(del.ok).toBe(true);
    const after = await db.recurringSchedule.findUnique({ where: { id: s.id } });
    expect(after!.active).toBe(false);
  });

  it("rejects non-existent schedule", async () => {
    const res = await deleteRecurringSchedule(999999);
    expect(res.ok).toBe(false);
  });
});

describe("skipRecurringDate / unskipRecurringDate", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  async function makeSchedule() {
    const res = await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "10:00",
    });
    if (!res.ok) throw new Error("create failed");
    return db.recurringSchedule.findFirstOrThrow({
      where: { groupId: w.groupAId },
    });
  }

  it("appends a skipped date", async () => {
    const s = await makeSchedule();
    const res = await skipRecurringDate(s.id, "2026-10-03");
    expect(res.ok).toBe(true);
    const updated = await db.recurringSchedule.findUnique({ where: { id: s.id } });
    expect((updated!.skippedDates as string[])).toContain("2026-10-03");
  });

  it("cannot skip the same date twice", async () => {
    const s = await makeSchedule();
    await skipRecurringDate(s.id, "2026-10-03");
    const res = await skipRecurringDate(s.id, "2026-10-03");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("متخطى بالفعل");
  });

  it("unskip removes the date", async () => {
    const s = await makeSchedule();
    await skipRecurringDate(s.id, "2026-10-03");
    const res = await unskipRecurringDate(s.id, "2026-10-03");
    expect(res.ok).toBe(true);
    const updated = await db.recurringSchedule.findUnique({ where: { id: s.id } });
    expect((updated!.skippedDates as string[])).not.toContain("2026-10-03");
  });

  it("rejects skipping a schedule from another academy", async () => {
    const s = await makeSchedule();
    const other = await seed();
    try {
      other.loginAs(other.admin);
      const res = await skipRecurringDate(s.id, "2026-10-03");
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("الجدول غير موجود");
    } finally {
      await cleanupWorld(other);
    }
  });
});

describe("getRecurringSchedules", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  it("admin sees all academy schedules", async () => {
    await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "10:00",
    });
    await createRecurringSchedule({
      groupId: w.group2Id,
      tutorId: w.tutor2Id,
      dayOfWeek: 1,
      startTime: "12:00",
    });
    const res = await getRecurringSchedules(w.academyId);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toHaveLength(2);
  });

  it("tutor sees only their own schedules", async () => {
    await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "10:00",
    });
    await createRecurringSchedule({
      groupId: w.group2Id,
      tutorId: w.tutor2Id,
      dayOfWeek: 1,
      startTime: "12:00",
    });
    w.loginAs(w.tutor);
    const res = await getRecurringSchedules(w.academyId);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toHaveLength(1);
      expect(res.data[0].tutorId).toBe(w.tutorId);
    }
  });

  it("filter by group", async () => {
    await createRecurringSchedule({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dayOfWeek: 0,
      startTime: "10:00",
    });
    await createRecurringSchedule({
      groupId: w.group2Id,
      tutorId: w.tutor2Id,
      dayOfWeek: 1,
      startTime: "12:00",
    });
    const res = await getRecurringSchedules(w.academyId, w.groupAId);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toHaveLength(1);
      expect(res.data[0].groupId).toBe(w.groupAId);
    }
  });
});