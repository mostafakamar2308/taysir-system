/**
 * Integration tests for the recurring-schedule materialization engine.
 *
 * Runs against the real local DB (localhost:5433) using an isolated academy
 * prefixed "TEST-RECURRING-" which is fully deleted afterwards. Exercises the
 * engine directly (lib/recurringScheduling.ts) — server actions require a
 * Next.js request context and cannot be invoked here.
 *
 * NOTE: materializeAllUpcoming() is intentionally NOT called: it iterates over
 * EVERY academy's schedules and would create real sessions for other academies
 * in the DB. Its per-date logic is identical to materializeScheduleOnDate(),
 * which is exercised exhaustively below.
 *
 * Run:  pnpm test:recurring      (see package.json)
 */
import "dotenv/config";
import assert from "node:assert/strict";
import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { localToUTC } from "@/lib/dates";
import {
  appDayOfWeek,
  scheduleWallClock,
  materializeRecurringSessionById,
  getRecurringSlotsForWeek,
  type MaterializationResult,
} from "@/lib/recurringScheduling";

const ACADEMY_NAME = `TEST-RECURRING-${Date.now()}`;

const log = (msg: string) => console.log(msg);
const check = (label: string, cond: boolean) => {
  if (!cond) throw new Error(`FAILED: ${label}`);
  log(`  ok - ${label}`);
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const startTimeUtc = (time: string): Date => {
  const [h, m] = time.split(":").map(Number);
  return dayjs.utc().hour(h).minute(m).second(0).millisecond(0).toDate();
};

/** First date strictly after today whose app day-of-week equals `doy`. */
const firstFutureDate = (doy: number): string => {
  let d = dayjs().add(1, "day");
  while (appDayOfWeek(d) !== doy) d = d.add(1, "day");
  return d.format("YYYY-MM-DD");
};

const saturdayOfWeek = (dateStr: string): Date => {
  const d = dayjs(dateStr);
  const offset = (d.day() + 1) % 7; // days since Saturday
  return d.subtract(offset, "day").startOf("day").toDate();
};

type Seed = {
  academyId: number;
  currencyId: number;
  tutorId: number;
  supervisorId: number;
  groupAId: number;
  groupEmptyId: number;
  groupConflictId: number;
  groupExpId: number;
  student1Id: number;
  student2Id: number;
  student3Id: number;
};

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

async function seed(): Promise<Seed> {
  const currency = await db.currency.create({
    data: { code: `TST${Date.now() % 100000}`, name: "TEST CURRENCY", symbol: "T" },
  });

  const academy = await db.academy.create({
    data: {
      name: ACADEMY_NAME,
      maxTutors: 10,
      maxStudents: 50,
      primaryColor: "#000000",
      defaultCurrencyId: currency.id,
    },
  });

  await db.academySettings.create({
    data: { academyId: academy.id, tutorsCanCreateSessions: true },
  });

  const makeUser = async (name: string) =>
    db.user.create({
      data: { name, username: `${name}-${Date.now()}-${Math.random()}`, password: "x", role: 0 },
    });

  const tutorUser = await makeUser("TEST-TUTOR");
  const supervisorUser = await makeUser("TEST-SUPERVISOR");
  const student1User = await makeUser("TEST-STUDENT-1");
  const student2User = await makeUser("TEST-STUDENT-2");
  const student3User = await makeUser("TEST-STUDENT-3");

  const supervisor = await db.supervisor.create({
    data: {
      userId: supervisorUser.id,
      academyId: academy.id,
      active: true,
    },
  });

  const tutor = await db.tutor.create({
    data: {
      userId: tutorUser.id,
      academyId: academy.id,
      currencyId: currency.id,
      baseHourlyRate: 40,
      baseGroupHourlyRate: 50,
      active: true,
      defaultSupervisorId: supervisor.id,
      zoomUrl: "https://zoom.us/test-recurring",
    },
  });

  const mkStudent = async (userId: number, status: number) =>
    db.student.create({
      data: {
        userId,
        academyId: academy.id,
        currencyId: currency.id,
        status,
      },
    });

  const s1 = await mkStudent(student1User.id, 1);
  const s2 = await mkStudent(student2User.id, 1);
  const s3 = await mkStudent(student3User.id, 0);

  const mkGroup = (title: string) =>
    db.group.create({
      data: {
        title,
        academyId: academy.id,
        currentTutorId: tutor.id,
        tutorHourlyRate: title === "A" ? 45 : title === "CONFLICT" ? 35 : null,
        studentSessionPrice: title === "A" ? 30 : null,
      },
    });

  const groupA = await mkGroup("A");
  const groupEmpty = await mkGroup("EMPTY");
  const groupConflict = await mkGroup("CONFLICT");
  const groupExp = await mkGroup("EXP");

  await db.groupStudent.createMany({
    data: [
      { groupId: groupA.id, studentId: s1.id, customSessionPrice: 25 },
      { groupId: groupA.id, studentId: s2.id },
      { groupId: groupConflict.id, studentId: s3.id },
    ],
  });

  return {
    academyId: academy.id,
    currencyId: currency.id,
    tutorId: tutor.id,
    supervisorId: supervisor.id,
    groupAId: groupA.id,
    groupEmptyId: groupEmpty.id,
    groupConflictId: groupConflict.id,
    groupExpId: groupExp.id,
    student1Id: s1.id,
    student2Id: s2.id,
    student3Id: s3.id,
  };
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanup(seedData: Seed) {
  const { academyId, currencyId } = seedData;
  try {
    await db.recurringSchedule.deleteMany({ where: { academyId } });
    await db.session.deleteMany({ where: { academyId } });
    await db.group.deleteMany({ where: { academyId } });
    await db.student.deleteMany({ where: { academyId } });
    await db.tutor.deleteMany({ where: { academyId } });
    await db.supervisor.deleteMany({ where: { academyId } });
    await db.academySettings.deleteMany({ where: { academyId } });
    await db.academyCurrencyRate.deleteMany({ where: { academyId } });
    await db.plan.deleteMany({ where: { academyId } });
    await db.revenue.deleteMany({ where: { academyId } });
    await db.expense.deleteMany({ where: { academyId } });
    await db.history.deleteMany({ where: { academyId } });
    await db.whatsAppMessage.deleteMany({ where: { academyId } });
    await db.chatRoom.deleteMany({ where: { academyId } });
    await db.groupChatRoom.deleteMany({ where: { academyId } });
    await db.academy.update({
      where: { id: academyId },
      data: { defaultCurrencyId: null },
    });
    await db.academy.delete({ where: { id: academyId } });
    await db.currency.delete({ where: { id: currencyId } });
  } catch (err) {
    console.error("CLEANUP INCOMPLETE (manual cleanup may be needed):", err);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function testDayMapping() {
  log("\n# appDayOfWeek mapping (0=Sat ... 6=Fri)");
  const base = dayjs("2026-09-12"); // Saturday
  for (let i = 0; i < 7; i++) {
    const date = base.add(i, "day").format("YYYY-MM-DD");
    check(`${date} -> ${i}`, appDayOfWeek(new Date(`${date}T12:00:00`)) === i);
  }
}

async function testWallClock(seedData: Seed) {
  log("\n# scheduleWallClock (literal-UTC storage round-trip)");
  const schedule = await db.recurringSchedule.create({
    data: {
      groupId: seedData.groupAId,
      tutorId: seedData.tutorId,
      academyId: seedData.academyId,
      dayOfWeek: 0, // Saturday
      startTime: startTimeUtc("16:00"),
      durationMinutes: 60,
    },
  });
  const clock = scheduleWallClock(schedule);
  check(`startTime "16:00" reads back 16:00`, clock.hour === 16 && clock.minute === 0);
  await db.recurringSchedule.delete({ where: { id: schedule.id } });
}

async function testHappyPath(seedData: Seed) {
  log("\n# materializeRecurringSessionById - happy path");
  const date = firstFutureDate(0); // Saturday
  const schedule = await db.recurringSchedule.create({
    data: {
      groupId: seedData.groupAId,
      tutorId: seedData.tutorId,
      academyId: seedData.academyId,
      dayOfWeek: 0,
      startTime: startTimeUtc("16:00"),
      durationMinutes: 60,
      topic: "المنهج الأساسي",
    },
  });

  const result = await materializeRecurringSessionById(schedule.id, date, {
    academyId: seedData.academyId,
    tutorId: seedData.tutorId,
  });
  check("materializes ok", result.ok === true);
  if (!result.ok) throw new Error("unexpected error: " + result.error);
  const session = await db.session.findUnique({
    where: { id: result.sessionId },
    include: { participants: true },
  });
  assert(session);

  check("recurringScheduleId linked", session.recurringScheduleId === schedule.id);
  check("groupId linked", session.groupId === seedData.groupAId);
  check("tutor linked", session.tutorId === seedData.tutorId);
  check("academy linked", session.academyId === seedData.academyId);
  check("duration 60", session.durationMinutes === 60);
  check("topic set", session.topic === "المنهج الأساسي");
  // timezone: created instant must DISPLAY at the picked wall clock ("16:00")
  check(
    "wall clock preserved",
    dayjs.utc(session.startTime).local().format("HH:mm") === "16:00",
  );
  check(
    "stored instant == localToUTC(date, 16:00)",
    session.startTime.getTime() === localToUTC(date, "16:00").getTime(),
  );
  check("zoomUrl starts empty", session.zoomUrl === null);
  check(
    "supervisor = tutor default supervisor",
    session.supervisorId === seedData.supervisorId,
  );
  // tutorRate: group.tutorHourlyRate override = 45
  check("tutorRate = group override 45", session.tutorRate === 45);

  const byStudent = new Map(
    session.participants.map((p) => [p.studentId, p]),
  );
  check("2 participants", session.participants.length === 2);
  check(
    "student1 custom price 25",
    byStudent.get(seedData.student1Id)?.price === 25,
  );
  check(
    "student2 default price 30",
    byStudent.get(seedData.student2Id)?.price === 30,
  );
  check(
    "paymentStatus pending(0)",
    [...byStudent.values()].every((p) => p.paymentStatus === 0),
  );

  log("\n# slot hidden once a session exists (same week)");
  const weekStart = saturdayOfWeek(date);
  const slots = await getRecurringSlotsForWeek(seedData.academyId, weekStart);
  const mySlots = slots.filter((s) => s.id === schedule.id);
  check("no slot for materialized date", mySlots.length === 0);

  log("\n# duplicate + cancelled deadlock block");
  const again = await materializeRecurringSessionById(schedule.id, date, {
    academyId: seedData.academyId,
  });
  assertResult(again, "هذه الحصة موجودة بالفعل");
  await db.session.update({
    where: { id: session.id },
    data: { cancelledBy: 1 },
  });
  const onCancelled = await materializeRecurringSessionById(schedule.id, date, {
    academyId: seedData.academyId,
  });
  check(
    "cancelled session still blocks re-materialization",
    onCancelled.ok === false && onCancelled.error === "هذه الحصة موجودة بالفعل",
  );
  const slots2 = await getRecurringSlotsForWeek(seedData.academyId, weekStart);
  check(
    "slot stays hidden for cancelled session",
    slots2.filter((s) => s.id === schedule.id).length === 0,
  );

  await db.recurringSchedule.delete({ where: { id: schedule.id } });
  return { participantCount: session.participants.length };
}

async function testOtherOccurrenceStillShowsSlot(seedData: Seed) {
  log("\n# other occurrences of same schedule still show slots");
  const date = firstFutureDate(0);
  const schedule = await db.recurringSchedule.create({
    data: {
      groupId: seedData.groupAId,
      tutorId: seedData.tutorId,
      academyId: seedData.academyId,
      dayOfWeek: 0,
      startTime: startTimeUtc("16:00"),
      durationMinutes: 90,
    },
  });
  const weekStart = saturdayOfWeek(date);
  const slots = await getRecurringSlotsForWeek(seedData.academyId, weekStart);
  const mySlot = slots.find((s) => s.id === schedule.id);
  assert(mySlot, "expected a slot this week");
  check("slot startTime is wall clock", mySlot.startTime === "16:00");
  check("slot duration", mySlot.durationMinutes === 90);
  check("slot date", mySlot.nextOccurrence === date);
  check("slot group name", mySlot.groupName === "A");
  check("slot tutor name", mySlot.tutorName === "TEST-TUTOR");
  check(
    "wall-clock==nextOccurrence materializable before create",
    materializeOkOrDefault(await materializeRecurringSessionById(schedule.id, date, {
      academyId: seedData.academyId,
    })) === true,
  );
  await db.recurringSchedule.delete({ where: { id: schedule.id } });
}

async function testFailures(seedData: Seed) {
  log("\n# failure paths");

  // skipped date
  const skipDate = firstFutureDate(1); // Sunday
  const skipSchedule = await db.recurringSchedule.create({
    data: {
      groupId: seedData.groupAId,
      tutorId: seedData.tutorId,
      academyId: seedData.academyId,
      dayOfWeek: 1,
      startTime: startTimeUtc("10:00"),
      skippedDates: [skipDate],
    },
  });
  assertResult(
    await materializeRecurringSessionById(skipSchedule.id, skipDate, {
      academyId: seedData.academyId,
    }),
    "هذا التاريخ متخطى",
  );
  const weekStart1 = saturdayOfWeek(skipDate);
  const skipSlots = await getRecurringSlotsForWeek(seedData.academyId, weekStart1);
  check(
    "skipped date hidden from slots",
    !skipSlots.some((s) => s.id === skipSchedule.id),
  );

  // past date (same weekday as schedule)
  assertResult(
    await materializeRecurringSessionById(skipSchedule.id, "2020-01-05", {
      academyId: seedData.academyId,
    }),
    "لا يمكن إنشاء حصة في الماضي",
  );

  // wrong day of week
  const wrongDate = firstFutureDate(2); // Monday != schedule's Sunday
  assertResult(
    await materializeRecurringSessionById(skipSchedule.id, wrongDate, {
      academyId: seedData.academyId,
    }),
    "اليوم لا يطابق الجدول المتكرر",
  );

  // missing schedule / inactive schedule
  assertResult(
    await materializeRecurringSessionById(999999999, skipDate, {
      academyId: seedData.academyId,
    }),
    "الجدول غير موجود",
  );
  const inact = await db.recurringSchedule.create({
    data: {
      groupId: seedData.groupAId,
      tutorId: seedData.tutorId,
      academyId: seedData.academyId,
      dayOfWeek: 3,
      startTime: startTimeUtc("11:00"),
      active: false,
    },
  });
  assertResult(
    await materializeRecurringSessionById(inact.id, firstFutureDate(3), {
      academyId: seedData.academyId,
    }),
    "الجدول غير موجود",
  );

  // authorization guards
  assertResult(
    await materializeRecurringSessionById(skipSchedule.id, skipDate, {
      academyId: seedData.academyId + 9999,
    }),
    "غير مصرح",
  );
  assertResult(
    await materializeRecurringSessionById(skipSchedule.id, skipDate, {
      academyId: seedData.academyId,
      tutorId: seedData.tutorId + 9999,
    }),
    "غير مصرح",
  );
  await db.recurringSchedule.deleteMany({ where: { id: { in: [skipSchedule.id, inact.id] } } });
}

async function testEmptyGroup(seedData: Seed) {
  log("\n# empty group (no active members)");
  const date = firstFutureDate(4);
  const schedule = await db.recurringSchedule.create({
    data: {
      groupId: seedData.groupEmptyId,
      tutorId: seedData.tutorId,
      academyId: seedData.academyId,
      dayOfWeek: 4,
      startTime: startTimeUtc("15:00"),
    },
  });
  assertResult(
    await materializeRecurringSessionById(schedule.id, date, {
      academyId: seedData.academyId,
    }),
    "لا يوجد طلاب في المجموعة",
  );
  const weekStart = saturdayOfWeek(date);
  const slots = await getRecurringSlotsForWeek(seedData.academyId, weekStart);
  check("no slots for empty group", !slots.some((s) => s.id === schedule.id));
  await db.recurringSchedule.delete({ where: { id: schedule.id } });
}

async function testConflict(seedData: Seed) {
  log("\n# conflict detection (overlapping manual session)");
  const date = firstFutureDate(5);
  const schedule = await db.recurringSchedule.create({
    data: {
      groupId: seedData.groupConflictId,
      tutorId: seedData.tutorId,
      academyId: seedData.academyId,
      dayOfWeek: 5,
      startTime: startTimeUtc("16:00"),
      durationMinutes: 60,
    },
  });

  // Manually create an overlapping session: same tutor + a participant student
  const conflictStart = localToUTC(date, "15:30"); // 15:30-17:00 overlaps 16:00
  const manual = await db.session.create({
    data: {
      startTime: conflictStart,
      durationMinutes: 90,
      groupId: seedData.groupConflictId,
      tutorId: seedData.tutorId,
      tutorRate: 35,
      academyId: seedData.academyId,
    },
  });
  await db.sessionParticipant.createMany({
    data: [
      { sessionId: manual.id, studentId: seedData.student3Id, price: 0 },
      { sessionId: manual.id, studentId: seedData.student1Id, price: 0 },
    ],
  });

  assertResult(
    await materializeRecurringSessionById(schedule.id, date, {
      academyId: seedData.academyId,
    }),
    "تعارض في المواعيد مع هذه الحصة",
  );

  // no session created during conflict
  const count = await db.session.count({
    where: {
      recurringScheduleId: schedule.id,
      startTime: {
        gte: dayjs(localToUTC(date, "00:00")).toDate(),
        lte: dayjs(localToUTC(date, "23:59")).toDate(),
      },
    },
  });
  check("no session materialized on conflict", count === 0);

  await db.session.delete({ where: { id: manual.id } });
  await db.recurringSchedule.delete({ where: { id: schedule.id } });
  return manual.id;
}

async function testExpired(seedData: Seed) {
  log("\n# expired schedule (endDate in the past)");
  const schedule = await db.recurringSchedule.create({
    data: {
      groupId: seedData.groupExpId,
      tutorId: seedData.tutorId,
      academyId: seedData.academyId,
      dayOfWeek: 2,
      startTime: startTimeUtc("12:00"),
      endDate: dayjs().subtract(1, "day").toDate(),
    },
  });
  assertResult(
    await materializeRecurringSessionById(schedule.id, firstFutureDate(2), {
      academyId: seedData.academyId,
    }),
    "انتهى الجدول المتكرر",
  );
  const weekStart = saturdayOfWeek(firstFutureDate(2));
  const slots = await getRecurringSlotsForWeek(seedData.academyId, weekStart);
  check("expired schedule has no slots", !slots.some((s) => s.id === schedule.id));
  await db.recurringSchedule.delete({ where: { id: schedule.id } });
}

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

function assertResult(r: MaterializationResult, error: string) {
  check(
    `fails with "${error}"`,
    r.ok === false && r.error === error,
  );
}

function materializeOkOrDefault(r: MaterializationResult): boolean {
  return r.ok === true;
}

async function main() {
  let seedData: Seed | null = null;
  const started = Date.now();
  try {
    seedData = await seed();
    log(`Seeded academy ${ACADEMY_NAME} (id=${seedData.academyId})`);

    await testDayMapping();
    await testWallClock(seedData);
    await testHappyPath(seedData);
    await testOtherOccurrenceStillShowsSlot(seedData);
    await testFailures(seedData);
    await testEmptyGroup(seedData);
    await testConflict(seedData);
    await testExpired(seedData);

    console.log(`\nALL TESTS PASSED in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  } finally {
    if (seedData) await cleanup(seedData);
  }
}

main().catch((e) => {
  console.error("\nTEST FAILURE", e);
  process.exitCode = 1;
});