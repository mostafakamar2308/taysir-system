import db from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { Role } from "@/types/user";
import { StudentStatus } from "@/types/student";
import { SubscriptionStatus } from "@/types/subscription";
import dayjs from "@/lib/dayjs";
import { setAuthToken } from "./auth";

/**
 * A seeded, isolated academy ("TEST-<timestamp>") used by one test file.
 * Every test creates its own world in beforeEach and tears it down in
 * afterEach, so groups/students/times never collide across tests.
 */
export interface TestUser {
  userId: number;
  name: string;
  role: number;
  academyId: number;
  tutorId: number | null;
  studentId: number | null;
}

export interface TestWorld {
  academyId: number;
  currencyId: number;
  admin: TestUser;
  supervisorId: number;
  supervisorUserId: number;
  tutor: TestUser;
  tutor2: TestUser;
  tutorId: number;
  tutor2Id: number;
  student1Id: number;
  student1UserId: number;
  student2Id: number;
  student2UserId: number;
  student3Id: number;
  student3UserId: number;
  groupAId: number;
  groupBId: number;
  group2Id: number;
  groupEmptyId: number;
  loginAs: (u: TestUser) => void;
  logout: () => void;
}

const makeName = (label: string) => `${label}-${Date.now()}-${Math.random()}`;

export async function seed(): Promise<TestWorld> {
  const stamp = `${Date.now()}-${Math.random()}`;
  const academyName = `TEST-${stamp}`;

  const currency = await db.currency.create({
    data: { code: `TST${Date.now() % 100000}`, name: "TEST CURRENCY", symbol: "T" },
  });
  const academy = await db.academy.create({
    data: {
      name: academyName,
      maxTutors: 10,
      maxStudents: 50,
      primaryColor: "#3b82f6",
      defaultCurrencyId: currency.id,
    },
  });
  await db.academySettings.create({
    data: {
      academyId: academy.id,
      tutorsCanCreateSessions: true,
      tutorsCanEditSessionTime: true,
    },
  });

  const makeUser = async (name: string, role: number) =>
    db.user.create({
      data: { name, username: makeName(name), password: "x", role },
    });

  const adminUser = await makeUser("TEST-ADMIN", Role.Admin);
  const supervisorUser = await makeUser("TEST-SUPERVISOR", Role.Supervisor);
  const tutorUser = await makeUser("TEST-TUTOR", Role.Tutor);
  const tutor2User = await makeUser("TEST-TUTOR-2", Role.Tutor);
  const s1User = await makeUser("TEST-STUDENT-1", Role.Student);
  const s2User = await makeUser("TEST-STUDENT-2", Role.Student);
  const s3User = await makeUser("TEST-STUDENT-3", Role.Student);

  await db.admin.create({ data: { userId: adminUser.id, academyId: academy.id } });

  const supervisor = await db.supervisor.create({
    data: { userId: supervisorUser.id, academyId: academy.id, active: true },
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
      zoomUrl: "https://zoom.us/test-tutor",
    },
  });
  const tutor2 = await db.tutor.create({
    data: {
      userId: tutor2User.id,
      academyId: academy.id,
      currencyId: currency.id,
      baseHourlyRate: 30,
      baseGroupHourlyRate: 35,
      active: true,
    },
  });

  const mkStudent = async (userId: number, status: number) =>
    db.student.create({
      data: { userId, academyId: academy.id, currencyId: currency.id, status },
    });
  const s1 = await mkStudent(s1User.id, StudentStatus.subscribed);
  const s2 = await mkStudent(s2User.id, StudentStatus.subscribed);
  const s3 = await mkStudent(s3User.id, StudentStatus.lead);

  const mkGroup = async (title: string, tutorId: number, extra?: object) =>
    db.group.create({
      data: {
        title,
        academyId: academy.id,
        currentTutorId: tutorId,
        ...extra,
      },
    });

  const groupA = await mkGroup("GROUP-A", tutor.id, {
    tutorHourlyRate: 45,
    studentSessionPrice: 30,
  });
  const groupB = await mkGroup("GROUP-B", tutor.id);
  const group2 = await mkGroup("GROUP-2", tutor2.id, {
    studentSessionPrice: 20,
  });
  const groupEmpty = await mkGroup("GROUP-EMPTY", tutor.id);

  await db.groupStudent.createMany({
    data: [
      { groupId: groupA.id, studentId: s1.id, customSessionPrice: 25 },
      { groupId: groupA.id, studentId: s2.id },
      { groupId: groupB.id, studentId: s3.id },
      { groupId: group2.id, studentId: s2.id },
    ],
  });

  const admin: TestUser = {
    userId: adminUser.id,
    name: "TEST-ADMIN",
    role: Role.Admin,
    academyId: academy.id,
    tutorId: null,
    studentId: null,
  };
  const tutorUserT: TestUser = {
    userId: tutorUser.id,
    name: "TEST-TUTOR",
    role: Role.Tutor,
    academyId: academy.id,
    tutorId: tutor.id,
    studentId: null,
  };
  const tutor2UserT: TestUser = {
    userId: tutor2User.id,
    name: "TEST-TUTOR-2",
    role: Role.Tutor,
    academyId: academy.id,
    tutorId: tutor2.id,
    studentId: null,
  };

  return {
    academyId: academy.id,
    currencyId: currency.id,
    admin,
    supervisorId: supervisor.id,
    supervisorUserId: supervisorUser.id,
    tutor: tutorUserT,
    tutor2: tutor2UserT,
    tutorId: tutor.id,
    tutor2Id: tutor2.id,
    student1Id: s1.id,
    student1UserId: s1User.id,
    student2Id: s2.id,
    student2UserId: s2User.id,
    student3Id: s3.id,
    student3UserId: s3User.id,
    groupAId: groupA.id,
    groupBId: groupB.id,
    group2Id: group2.id,
    groupEmptyId: groupEmpty.id,
    loginAs,
    logout,
  };

  function loginAs(u: TestUser) {
    const payload = {
      id: u.userId,
      email: `${u.name}@test.local`,
      name: u.name,
      role: u.role,
      academyId: u.academyId ?? undefined,
      tutorId: u.tutorId ?? undefined,
      studentId: u.studentId ?? undefined,
    };
    setAuthToken(signToken(payload));
  }

  function logout() {
    setAuthToken(undefined);
  }
}

export async function cleanupWorld(w: TestWorld): Promise<void> {
  const { academyId, currencyId } = w;
  try {
    await db.timeExtensionRequest.deleteMany({
      where: { session: { academyId } },
    });
    await db.session.deleteMany({ where: { academyId } });
    await db.recurringSchedule.deleteMany({ where: { academyId } });
    await db.history.deleteMany({ where: { academyId } });
    await db.group.deleteMany({ where: { academyId } });
    await db.student.deleteMany({ where: { academyId } });
    await db.tutor.deleteMany({ where: { academyId } });
    await db.supervisor.deleteMany({ where: { academyId } });
    await db.admin.deleteMany({ where: { academyId } });
    await db.academySettings.deleteMany({ where: { academyId } });
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

/** Give a student in `groupId` an active subscription with `sessionCount`. */
export async function addSubscription(
  w: TestWorld,
  groupId: number,
  studentId: number,
  sessionCount: number,
  status = SubscriptionStatus.active,
) {
  const member = await db.groupStudent.findFirstOrThrow({
    where: { groupId, studentId },
  });
  return db.subscription.create({
    data: {
      groupStudentId: member.id,
      price: 100,
      currencyId: w.currencyId,
      sessionCount,
      status,
      startDate: dayjs().subtract(30, "day").toDate(),
    },
  });
}

/** App-convention day-of-week: 0=Saturday .. 6=Friday. */
export function appDayOfWeek(date: Date | dayjs.Dayjs): number {
  return (dayjs(date).day() + 1) % 7;
}

/** First date strictly after today whose app day-of-week equals `doy`. */
export function firstFutureDate(doy: number): string {
  let d = dayjs().add(1, "day");
  while (appDayOfWeek(d) !== doy) d = d.add(1, "day");
  return d.format("YYYY-MM-DD");
}

/** Literal-UTC Date for a wall-clock time (time-of-day storage convention). */
export function startTimeUtc(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return dayjs.utc().hour(h).minute(m).second(0).millisecond(0).toDate();
}

/** ISO UTC string for "2 days from now at the given wall-clock hour". */
export function isoFuture(time = "10:00", dayOffset = 2): string {
  const [h, m] = time.split(":").map(Number);
  return dayjs()
    .add(dayOffset, "day")
    .hour(h)
    .minute(m)
    .second(0)
    .millisecond(0)
    .toISOString();
}

/** ISO UTC for a datetime a given number of minutes in the future. */
export function isoInMinutes(minutes: number): string {
  return dayjs().add(minutes, "minute").toISOString();
}