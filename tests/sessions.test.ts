import { describe, it, expect, beforeEach, afterEach } from "vitest";
import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import {
  seed,
  cleanupWorld,
  isoFuture,
  addSubscription,
} from "./helpers/seed";
import type { TestWorld } from "./helpers/seed";
import {
  createSession,
  updateSession,
  cancelSession,
  deleteSession,
  createMultipleSessions,
} from "@/actions/sessions";
import { Role } from "@/types/user";

const T1 = () => isoFuture("10:00"); // +2d 10:00
const T2 = () => isoFuture("12:00"); // +2d 12:00
const EARLIER = () => isoFuture("09:00");
const HALF = () => isoFuture("09:30");

// createSession binds `date` in its input type but ignores it at runtime;
// the UI always sends it. This wrapper keeps test call sites tidy.
type CsArgs = Parameters<typeof createSession>[0];
const cs = (input: Omit<CsArgs, "date">) =>
  createSession({ ...input, date: "2026-01-01" });

describe("createSession", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  describe("happy path", () => {
    it("creates a group session with default fields", async () => {
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.data.groupId).toBe(w.groupAId);
      expect(res.data.tutorId).toBe(w.tutorId);
      expect(res.data.academyId).toBe(w.academyId);
      expect(res.data.durationMinutes).toBe(60);
      expect(res.data.isTrial).toBe(false);
      expect(res.data.cancelledBy).toBeNull();

      const session = await db.session.findUnique({
        where: { id: res.data.id },
        include: { participants: true },
      });
      expect(session).not.toBeNull();
      expect(session!.participants).toHaveLength(2);
      expect(session!.supervisorId).toBe(w.supervisorId);
      expect(session!.zoomUrl).toBeNull();
    });

    it("freezes tutor rate from group override", async () => {
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.tutorRate).toBe(45);
    });

    it("freezes per-student prices (custom > group > 0)", async () => {
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const session = await db.session.findUnique({
        where: { id: res.data.id },
        include: { participants: true },
      });
      const byStudent = new Map(
        session!.participants.map((p) => [p.studentId, p]),
      );
      expect(byStudent.get(w.student1Id)!.price).toBe(25);
      expect(byStudent.get(w.student2Id)!.price).toBe(30);
    });

    it("uses tutor base rate when group has no rate", async () => {
      const g = await db.group.create({
        data: {
          title: "NO-RATE-GROUP",
          academyId: w.academyId,
          currentTutorId: w.tutorId,
        },
      });
      await db.groupStudent.createMany({
        data: [
          { groupId: g.id, studentId: w.student1Id },
          { groupId: g.id, studentId: w.student2Id },
        ],
      });
      const res = await cs({
        groupId: g.id,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.tutorRate).toBe(50); // baseGroupHourlyRate
    });

    it("trial sessions freeze prices to 0", async () => {
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
        isTrial: true,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const session = await db.session.findUnique({
        where: { id: res.data.id },
        include: { participants: true },
      });
      expect(session!.participants.every((p) => p.price === 0)).toBe(true);
    });

    it("creates a private 1:1 session and auto-creates a private group", async () => {
      // A tutor with no existing groups forces the private-group auto-creation path.
      const tutor3User = await db.user.create({
        data: {
          name: "TEST-TUTOR-3",
          username: `t3-${Date.now()}-${Math.random()}`,
          password: "x",
          role: Role.Tutor,
        },
      });
      const tutor3 = await db.tutor.create({
        data: {
          userId: tutor3User.id,
          academyId: w.academyId,
          currencyId: w.currencyId,
          baseHourlyRate: 10,
          baseGroupHourlyRate: 12,
        },
      });

      w.logout();
      const res = await cs({
        studentId: w.student1Id,
        tutorId: tutor3.id,
        startTime: T2(),
        duration: 60,
      });
      expect(res.ok).toBe(false); // not logged in

      w.loginAs(w.admin);
      const res2 = await cs({
        studentId: w.student1Id,
        tutorId: tutor3.id,
        startTime: T2(),
        duration: 60,
      });
      expect(res2.ok).toBe(true);
      if (!res2.ok) return;

      const group = await db.group.findUnique({
        where: { id: res2.data.groupId },
        include: { members: { where: { active: true } } },
      });
      expect(group!.title).toContain("خاص");
      expect(group!.members).toHaveLength(1);
      const session = await db.session.findUnique({
        where: { id: res2.data.id },
        include: { participants: true },
      });
      expect(session!.participants).toHaveLength(1);
      expect(session!.participants[0].studentId).toBe(w.student1Id);
    });
  });

  describe("validation", () => {
    it("rejects past startTime", async () => {
      const past = dayjs().subtract(1, "hour").toISOString();
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: past,
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("الماضى");
    });

    it("rejects when neither group nor student is provided", async () => {
      const res = await cs({
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("يجب اختيار مجموعة أو طالب");
    });

    it("rejects non-existent group", async () => {
      const res = await cs({
        groupId: 999999,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("المجموعة غير موجودة");
    });

    it("rejects invalid zoom URL", async () => {
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
        zoomUrl: "http://not-secure.example",
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("رابط غير صحيح");
    });

    it("accepts a valid zoom URL", async () => {
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
        zoomUrl: "https://zoom.us/j/test",
      });
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.zoomUrl).toBe("https://zoom.us/j/test");
    });

    it("BUG: does NOT reject out-of-range duration (server-side)", async () => {
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 5000,
      });
      // After the fix this should fail with the duration validation message.
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("المدة");
    });
  });

  describe("conflict detection", () => {
    it("blocks overlapping sessions for the same tutor", async () => {
      await db.session.create({
        data: {
          startTime: new Date(T1()),
          durationMinutes: 60,
          groupId: w.groupAId,
          tutorId: w.tutorId,
          tutorRate: 0,
          academyId: w.academyId,
        },
      });
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: HALF(),
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("تعارض في المواعيد");
    });

    it("blocks overlapping sessions for the same student", async () => {
      const blocker = await db.session.create({
        data: {
          startTime: new Date(T1()),
          durationMinutes: 60,
          groupId: w.group2Id,
          tutorId: w.tutor2Id,
          tutorRate: 0,
          academyId: w.academyId,
        },
      });
      await db.sessionParticipant.create({
        data: { sessionId: blocker.id, studentId: w.student2Id, price: 0 },
      });

      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: HALF(),
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("تعارض في المواعيد");
    });

    it("allows back-to-back sessions (no gap overlap)", async () => {
      await db.session.create({
        data: {
          startTime: new Date(EARLIER()),
          durationMinutes: 60, // end 10:00
          groupId: w.groupAId,
          tutorId: w.tutorId,
          tutorRate: 0,
          academyId: w.academyId,
        },
      });
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(), // 10:00
        duration: 60,
      });
      expect(res.ok).toBe(true);
    });

    it("allows sessions with different tutors at the same time", async () => {
      await db.session.create({
        data: {
          startTime: new Date(T1()),
          durationMinutes: 60,
          groupId: w.groupAId,
          tutorId: w.tutorId,
          tutorRate: 0,
          academyId: w.academyId,
        },
      });
      const res = await cs({
        groupId: w.group2Id,
        tutorId: w.tutor2Id,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(true);
    });

    it("ignores cancelled sessions in conflict detection", async () => {
      await db.session.create({
        data: {
          startTime: new Date(T1()),
          durationMinutes: 60,
          groupId: w.groupAId,
          tutorId: w.tutorId,
          tutorRate: 0,
          academyId: w.academyId,
          cancelledBy: w.admin.userId,
        },
      });
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(true);
    });
  });

  describe("auth & roles", () => {
    it("rejects unauthenticated requests", async () => {
      w.logout();
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("غير مصرح");
    });

    it("blocked tutor settings prevent tutor from creating sessions", async () => {
      await db.academySettings.update({
        where: { academyId: w.academyId },
        data: { tutorsCanCreateSessions: false },
      });
      w.loginAs(w.tutor);
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("إضافة الحصص غير متاحة لك");
    });

    it("enabled tutor can create for themselves", async () => {
      w.loginAs(w.tutor);
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(true);
    });

    it("tutor cannot create for a different tutor", async () => {
      w.loginAs(w.tutor);
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutor2Id,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("يمكنك فقط إضافة حصص لنفسك");
    });
  });

  describe("trial & warnings", () => {
    it("promotes lead students to trial on trial sessions", async () => {
      const res = await cs({
        groupId: w.groupBId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
        isTrial: true,
      });
      expect(res.ok).toBe(true);
      const student = await db.student.findUnique({
        where: { id: w.student3Id },
      });
      expect(student!.status).toBe(1); // trial
    });

    it("warns when a student has no remaining sessions but still schedules", async () => {
      await addSubscription(w, w.groupAId, w.student1Id, 0);
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.data.warnings.length).toBeGreaterThan(0);
      expect(res.data.warnings[0]).toContain("لا توجد حصص متبقية");
    });

    it("gives no warning when the student has remaining sessions", async () => {
      await addSubscription(w, w.groupAId, w.student1Id, 10);
      const res = await cs({
        groupId: w.groupAId,
        tutorId: w.tutorId,
        startTime: T1(),
        duration: 60,
      });
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.warnings).toHaveLength(0);
    });
  });
});

describe("updateSession", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  async function makeSession(startTime: string, tutorId?: number) {
    return db.session.create({
      data: {
        startTime: new Date(startTime),
        durationMinutes: 60,
        groupId: w.groupAId,
        tutorId: tutorId ?? w.tutorId,
        tutorRate: 0,
        academyId: w.academyId,
      },
    });
  }

  it("updates topic and notes", async () => {
    const s = await makeSession(T1());
    const res = await updateSession({
      id: s.id,
      topic: "new topic",
      notes: "some notes",
    });
    expect(res.ok).toBe(true);
    const updated = await db.session.findUnique({ where: { id: s.id } });
    expect(updated!.topic).toBe("new topic");
    expect(updated!.notes).toBe("some notes");
  });

  it("updates startTime and duration", async () => {
    const s = await makeSession(T1());
    const res = await updateSession({ id: s.id, startTime: T2(), duration: 45 });
    expect(res.ok).toBe(true);
    const updated = await db.session.findUnique({ where: { id: s.id } });
    expect(updated!.durationMinutes).toBe(45);
    expect(dayjs(updated!.startTime).hour()).toBe(12);
  });

  it("updates zoomUrl and recordingLink", async () => {
    const s = await makeSession(T1());
    const res = await updateSession({
      id: s.id,
      zoomUrl: "https://zoom.us/j/updated",
      recordingLink: "https://zoom.us/rec/test",
    });
    expect(res.ok).toBe(true);
    const updated = await db.session.findUnique({ where: { id: s.id } });
    expect(updated!.zoomUrl).toBe("https://zoom.us/j/updated");
    expect(updated!.recordingLink).toBe("https://zoom.us/rec/test");
  });

  it("rejects invalid zoom URL", async () => {
    const s = await makeSession(T1());
    const res = await updateSession({ id: s.id, zoomUrl: "ftp://bad" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("رابط غير صحيح");
  });

  it("rejects invalid recording link", async () => {
    const s = await makeSession(T1());
    const res = await updateSession({ id: s.id, recordingLink: "bad" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("رابط غير صحيح");
  });

  it("rejects non-existent session", async () => {
    const res = await updateSession({ id: 999999, topic: "x" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("الجلسة غير موجودة");
  });

  describe("tutor restrictions", () => {
    it("tutor can update own session topic", async () => {
      w.loginAs(w.tutor);
      const s = await makeSession(T1());
      const res = await updateSession({ id: s.id, topic: "mine" });
      expect(res.ok).toBe(true);
    });

    it("tutor cannot update another tutor's session", async () => {
      w.loginAs(w.tutor);
      const s = await makeSession(T1(), w.tutor2Id);
      const res = await updateSession({ id: s.id, topic: "x" });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("غير مصرح");
    });

    it("tutor cannot change duration", async () => {
      w.loginAs(w.tutor);
      const s = await makeSession(T1());
      const res = await updateSession({ id: s.id, duration: 90 });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("تعديل مدة الحصة");
    });

    it("tutor cannot change time when editing time is disabled", async () => {
      await db.academySettings.update({
        where: { academyId: w.academyId },
        data: { tutorsCanEditSessionTime: false },
      });
      w.loginAs(w.tutor);
      const s = await makeSession(T1());
      const res = await updateSession({ id: s.id, startTime: T2() });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("تعديل مواعيد الحصص");
    });

    it("tutor can change time when editing time is enabled", async () => {
      w.loginAs(w.tutor);
      const s = await makeSession(T1());
      const res = await updateSession({ id: s.id, startTime: T2() });
      expect(res.ok).toBe(true);
    });
  });

  describe("BUG fixes (Phase 10)", () => {
    it("BUG: rejects update that moves a session into a conflicting slot", async () => {
      await makeSession(T1()); // 10:00-11:00
      const s2 = await makeSession(T2()); // 12:00-13:00
      const res = await updateSession({
        id: s2.id,
        startTime: isoFuture("10:30"),
        duration: 60,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain("تعارض في المواعيد");
    });

    it("BUG: rejects admin from another academy updating this academy's session", async () => {
      const s = await makeSession(T1());
      // Second academy with its own admin, but our world's admin touches it.
      const other = await seed();
      try {
        other.loginAs(other.admin);
        const res = await updateSession({ id: s.id, topic: "hacked" });
        expect(res.ok).toBe(false);
        if (!res.ok) expect(res.error).toContain("غير مصرح");
      } finally {
        await cleanupWorld(other);
      }
    });
  });
});

describe("cancelSession / deleteSession", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  async function makeSession() {
    return db.session.create({
      data: {
        startTime: new Date(T1()),
        durationMinutes: 60,
        groupId: w.groupAId,
        tutorId: w.tutorId,
        tutorRate: 0,
        academyId: w.academyId,
      },
    });
  }

  it("cancels an active session", async () => {
    const s = await makeSession();
    const res = await cancelSession(s.id, w.admin.userId);
    expect(res.ok).toBe(true);
    const updated = await db.session.findUnique({ where: { id: s.id } });
    expect(updated!.cancelledBy).toBe(w.admin.userId);
  });

  it("cannot cancel an already-cancelled session", async () => {
    const s = await makeSession();
    await cancelSession(s.id, w.admin.userId);
    const res = await cancelSession(s.id, w.admin.userId);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("لا يمكن إلغاء هذه الحصة");
  });

  it("cannot cancel a non-existent session", async () => {
    const res = await cancelSession(999999, w.admin.userId);
    expect(res.ok).toBe(false);
  });

  it("deletes (soft-cancels) an active session", async () => {
    const s = await makeSession();
    const res = await deleteSession(s.id);
    expect(res.ok).toBe(true);
    const updated = await db.session.findUnique({ where: { id: s.id } });
    expect(updated!.cancelledBy).not.toBeNull();
  });

  it("cannot delete a cancelled session", async () => {
    const s = await makeSession();
    await cancelSession(s.id, w.admin.userId);
    const res = await deleteSession(s.id);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("ملغية");
  });
});

describe("createMultipleSessions (batch)", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  const d2 = () => {
    const d = dayjs().add(2, "day");
    return d.format("YYYY-MM-DD");
  };
  const d3 = () => {
    const d = dayjs().add(3, "day");
    return d.format("YYYY-MM-DD");
  };

  it("creates multiple sessions", async () => {
    const res = await createMultipleSessions({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dates: [d2(), d3()],
      startTime: "10:00",
      duration: 60,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.created).toHaveLength(2);
    expect(res.data.skipped).toHaveLength(0);
  });

  it("deduplicates repeated dates", async () => {
    const res = await createMultipleSessions({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dates: [d2(), d2(), d2()],
      startTime: "10:00",
      duration: 60,
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.created).toHaveLength(1);
  });

  it("rejects an empty dates array", async () => {
    const res = await createMultipleSessions({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dates: [],
      startTime: "10:00",
      duration: 60,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("يجب اختيار تاريخ واحد");
  });

  it("rejects more than 31 dates", async () => {
    const dates = Array.from({ length: 32 }, (_, i) =>
      dayjs().add(3 + i, "day").format("YYYY-MM-DD"),
    );
    const res = await createMultipleSessions({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dates,
      startTime: "10:00",
      duration: 60,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("أكثر من 31");
  });

  it("rejects invalid time format", async () => {
    const res = await createMultipleSessions({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dates: [d2()],
      startTime: "25:00",
      duration: 60,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("وقت البدء غير صحيح");
  });

  it("rejects out-of-range duration", async () => {
    const res = await createMultipleSessions({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dates: [d2()],
      startTime: "10:00",
      duration: 14,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("المدة");
  });

  it("skips conflicts per date, creating the non-conflicting ones", async () => {
    await db.session.create({
      data: {
        startTime: new Date(dayjs(`${d2()}T10:00:00`).toISOString()),
        durationMinutes: 60,
        groupId: w.groupAId,
        tutorId: w.tutorId,
        tutorRate: 0,
        academyId: w.academyId,
      },
    });
    const res = await createMultipleSessions({
      groupId: w.groupAId,
      tutorId: w.tutorId,
      dates: [d2(), d3()],
      startTime: "10:00",
      duration: 60,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.created).toHaveLength(1);
    expect(res.data.skipped).toHaveLength(1);
    expect(res.data.skipped[0].reason).toContain("تعارض");
    expect(res.data.skipped[0].date).toBe(d2());
  });

  it("tutor can batch-create for themselves but not others", async () => {
    w.loginAs(w.tutor);
    const res = await createMultipleSessions({
      groupId: w.groupAId,
      tutorId: w.tutor2Id,
      dates: [d2()],
      startTime: "10:00",
      duration: 60,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("يمكنك فقط إضافة حصص لنفسك");
  });
});