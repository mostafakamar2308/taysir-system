import "dotenv/config";
import dayjs from "@/lib/dayjs";
import db from "@/lib/prisma";
import { HistoryActionType, TargetType } from "@/types/history";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { AttendanceStatus } from "@/types/session";
import { StudentStatus } from "@/types/student";
import { SubscriptionStatus } from "@/types/subscription";
import { Role } from "@/types/user";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker/locale/ar";

// ============================================================================
// Configuration
// ============================================================================

const SEED = 20240809;
const ACADEMY_NAME = "أكاديمية النمو";
const PASSWORD_PLAIN = "24689110134";

// All dates are generated relative to this reference point. Override with
// SEED_REFERENCE_DATE=YYYY-MM-DD to reproduce a fixed snapshot.
const REFERENCE_DATE = process.env.SEED_REFERENCE_DATE;
const NOW = (REFERENCE_DATE ? dayjs.utc(REFERENCE_DATE) : dayjs.utc()).startOf(
  "day",
);

faker.seed(SEED);

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);
const randomInt = (min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const monthKey = (d: dayjs.Dayjs) => d.format("YYYY-MM");

// ============================================================================
// Cleanup
// ============================================================================

async function cleanup() {
  console.log("🧹 Starting database cleanup...");
  await db.chatMessage.deleteMany();
  await db.chatRoom.deleteMany();
  await db.pushSubscription.deleteMany();
  await db.note.deleteMany();
  await db.tutorAttendance.deleteMany();
  await db.tutorAvailability.deleteMany();
  await db.studentAvailability.deleteMany();
  await db.homeworkSolution.deleteMany();
  await db.assignment.deleteMany();
  await db.sessionReport.deleteMany();
  await db.sessionParticipant.deleteMany();
  await db.session.deleteMany();
  await db.revenue.deleteMany();
  await db.expense.deleteMany();
  await db.subscription.deleteMany();
  await db.plan.deleteMany();
  await db.groupStudent.deleteMany();
  await db.group.deleteMany();
  await db.academyCurrencyRate.deleteMany();
  await db.student.deleteMany();
  await db.tutor.deleteMany();
  await db.supervisor.deleteMany();
  await db.admin.deleteMany();
  await db.superAdmin.deleteMany();
  await db.user.deleteMany();
  await db.speciality.deleteMany();
  await db.costCenter.deleteMany();
  await db.currency.deleteMany();
  await db.history.deleteMany();
  await db.lead.deleteMany();
  await db.whatsAppMessage.deleteMany();
  await db.saasPlan.deleteMany();
  await db.academy.deleteMany();
  console.log("🎉 Cleanup complete!");
}

// ============================================================================
// Base data
// ============================================================================

const SPECIALITY_TITLES = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "القرآن الكريم",
];

const PLAN_DEFS = [
  { title: "باقة البدء", sessionCount: 2, price: 150 },
  { title: "باقة التأسيس", sessionCount: 4, price: 240 },
  { title: "باقة الفردي", sessionCount: 6, price: 300 },
  { title: "باقة الشهرية", sessionCount: 8, price: 400 },
  { title: "باقة المتميزة", sessionCount: 10, price: 500 },
  { title: "باقة الاحتراف", sessionCount: 12, price: 600 },
  { title: "باقة المكثفة", sessionCount: 16, price: 800 },
  { title: "باقة المتقدمين", sessionCount: 20, price: 1000 },
];

const TUTOR_NAMES = [
  "أحمد السيد",
  "سارة محمود",
  "خالد عبد الرحمن",
  "منى إبراهيم",
  "محمود حسن",
  "فاطمة علي",
  "عمر شريف",
  "هدى مصطفى",
  "يوسف كامل",
  "ليلى فاروق",
  "كريم العزبي",
  "نادية عادل",
];

const TUTOR_DEFS = [
  { subject: "اللغة العربية", privateRate: 150, groupRate: 100 },
  { subject: "اللغة الإنجليزية", privateRate: 180, groupRate: 120 },
  { subject: "الرياضيات", privateRate: 120, groupRate: 80 },
  { subject: "العلوم", privateRate: 140, groupRate: 90 },
  { subject: "القرآن الكريم", privateRate: 200, groupRate: 150 },
  { subject: "اللغة العربية", privateRate: 160, groupRate: 110 },
  { subject: "اللغة الإنجليزية", privateRate: 200, groupRate: 130 },
  { subject: "الرياضيات", privateRate: 150, groupRate: 100 },
  { subject: "القرآن الكريم", privateRate: 250, groupRate: 180 },
  { subject: "العلوم", privateRate: 130, groupRate: 85 },
  { subject: "الرياضيات", privateRate: 100, groupRate: 60 },
  { subject: "اللغة الإنجليزية", privateRate: 220, groupRate: 140 },
];

type ClassGroupDef = {
  key: string;
  title: string;
  tutorIdx: number;
  tutorHourlyRate: number;
  studentSessionPrice: number;
  size: number;
  sessionsPerMonth: number;
  time: number;
  weekdays: number[];
  duration: number;
  active?: boolean;
  membershipChanges?: "addLater" | "someLeft" | "both";
  rateChange?: { fromOffsetDays: number; rate: number };
};

const CLASS_GROUP_DEFS: ClassGroupDef[] = [
  { key: "ar-egypt", title: "عربي - منهج مصري", tutorIdx: 0, tutorHourlyRate: 100, studentSessionPrice: 80, size: 7, sessionsPerMonth: 4, time: 16, weekdays: [2], duration: 90 },
  { key: "en-us", title: "English - American Curriculum", tutorIdx: 1, tutorHourlyRate: 140, studentSessionPrice: 120, size: 9, sessionsPerMonth: 4, time: 18, weekdays: [1], duration: 90 },
  { key: "math-egypt", title: "رياضيات - منهج مصري", tutorIdx: 2, tutorHourlyRate: 100, studentSessionPrice: 80, size: 7, sessionsPerMonth: 8, time: 16, weekdays: [2, 4], duration: 90 },
  { key: "science-egypt", title: "علوم - منهج مصري", tutorIdx: 3, tutorHourlyRate: 90, studentSessionPrice: 70, size: 5, sessionsPerMonth: 4, time: 13, weekdays: [3], duration: 90 },
  { key: "quran-tajweed", title: "قرآن - تجويد", tutorIdx: 4, tutorHourlyRate: 180, studentSessionPrice: 150, size: 3, sessionsPerMonth: 4, time: 8, weekdays: [0], duration: 90 },
  { key: "ar-gulf", title: "عربي - منهج خليجي", tutorIdx: 5, tutorHourlyRate: 130, studentSessionPrice: 100, size: 9, sessionsPerMonth: 4, time: 20, weekdays: [2], duration: 90, membershipChanges: "both" },
  { key: "en-gulf", title: "English - Gulf Curriculum", tutorIdx: 6, tutorHourlyRate: 160, studentSessionPrice: 140, size: 11, sessionsPerMonth: 8, time: 18, weekdays: [1, 4], duration: 90, membershipChanges: "someLeft" },
  { key: "math-us", title: "رياضيات - منهج أمريكي", tutorIdx: 7, tutorHourlyRate: 120, studentSessionPrice: 100, size: 7, sessionsPerMonth: 4, time: 16, weekdays: [3], duration: 90 },
  { key: "quran-hifz", title: "قرآن - حفظ", tutorIdx: 8, tutorHourlyRate: 200, studentSessionPrice: 180, size: 3, sessionsPerMonth: 4, time: 8, weekdays: [6], duration: 90 },
  { key: "science-us", title: "علوم - منهج أمريكي", tutorIdx: 9, tutorHourlyRate: 100, studentSessionPrice: 80, size: 5, sessionsPerMonth: 4, time: 13, weekdays: [0], duration: 90, membershipChanges: "addLater" },
  { key: "math-foundation", title: "رياضيات - تأسيس", tutorIdx: 10, tutorHourlyRate: 60, studentSessionPrice: 60, size: 5, sessionsPerMonth: 4, time: 10, weekdays: [5], duration: 90 },
  { key: "en-conv", title: "English - Conversation", tutorIdx: 11, tutorHourlyRate: 150, studentSessionPrice: 130, size: 3, sessionsPerMonth: 2, time: 20, weekdays: [4], duration: 90 },
  { key: "ar-nahw", title: "عربي - نحو متقدم", tutorIdx: 0, tutorHourlyRate: 110, studentSessionPrice: 90, size: 3, sessionsPerMonth: 2, time: 16, weekdays: [1], duration: 90 },
  { key: "math-tafadol", title: "رياضيات - تفاضل", tutorIdx: 2, tutorHourlyRate: 90, studentSessionPrice: 75, size: 2, sessionsPerMonth: 2, time: 18, weekdays: [3], duration: 90, rateChange: { fromOffsetDays: 45, rate: 80 } },
  { key: "science-biology", title: "علوم - أحياء", tutorIdx: 9, tutorHourlyRate: 85, studentSessionPrice: 70, size: 5, sessionsPerMonth: 2, time: 13, weekdays: [1], duration: 90 },
  { key: "quran-murajaa", title: "قرآن - مراجعة", tutorIdx: 4, tutorHourlyRate: 150, studentSessionPrice: 120, size: 4, sessionsPerMonth: 2, time: 8, weekdays: [5], duration: 90 },
];

const EMPTY_GROUP_DEF: ClassGroupDef = {
  key: "math-empty",
  title: "رياضيات - مجموعة جديدة (فارغة)",
  tutorIdx: 2,
  tutorHourlyRate: 80,
  studentSessionPrice: 70,
  size: 0,
  sessionsPerMonth: 0,
  time: 16,
  weekdays: [2],
  duration: 90,
};

const INACTIVE_GROUP_DEFS: (ClassGroupDef & { membershipsInactive: boolean })[] = [
  {
    key: "inactive-ar", title: "عربي - مجموعة قديمة", tutorIdx: 0, tutorHourlyRate: 100, studentSessionPrice: 80, size: 2,
    sessionsPerMonth: 3, time: 16, weekdays: [2], duration: 90, active: false, membershipsInactive: true,
  },
  {
    key: "inactive-en", title: "English - مجموعة قديمة", tutorIdx: 1, tutorHourlyRate: 130, studentSessionPrice: 110, size: 3,
    sessionsPerMonth: 3, time: 18, weekdays: [1], duration: 90, active: false, membershipsInactive: false,
  },
];

type PrivateGroupDef = {
  key: string;
  studentIdx: number;
  tutorIdx: number;
  tutorHourlyRate: number;
  price: number;
  sessionsPerMonth: number;
  time: number;
  duration: number;
  active?: boolean;
  historical?: boolean;
};

const PRIVATE_GROUP_DEFS: PrivateGroupDef[] = [
  { key: "pvt-s2", studentIdx: 2, tutorIdx: 1, tutorHourlyRate: 140, price: 500, sessionsPerMonth: 6, time: 18, duration: 60 },
  { key: "pvt-s1", studentIdx: 1, tutorIdx: 0, tutorHourlyRate: 160, price: 350, sessionsPerMonth: 4, time: 16, duration: 60 },
  { key: "pvt-s3", studentIdx: 3, tutorIdx: 4, tutorHourlyRate: 240, price: 600, sessionsPerMonth: 4, time: 20, duration: 60 },
  { key: "pvt-s7", studentIdx: 7, tutorIdx: 4, tutorHourlyRate: 220, price: 550, sessionsPerMonth: 4, time: 8, duration: 60 },
  { key: "pvt-s10", studentIdx: 10, tutorIdx: 0, tutorHourlyRate: 150, price: 400, sessionsPerMonth: 4, time: 10, duration: 60 },
  { key: "pvt-s15", studentIdx: 15, tutorIdx: 7, tutorHourlyRate: 150, price: 450, sessionsPerMonth: 5, time: 16, duration: 60 },
  { key: "pvt-s20", studentIdx: 20, tutorIdx: 1, tutorHourlyRate: 190, price: 500, sessionsPerMonth: 5, time: 18, duration: 60 },
  { key: "pvt-s26", studentIdx: 26, tutorIdx: 2, tutorHourlyRate: 150, price: 500, sessionsPerMonth: 5, time: 20, duration: 60 },
  { key: "pvt-s30", studentIdx: 30, tutorIdx: 7, tutorHourlyRate: 130, price: 350, sessionsPerMonth: 4, time: 13, duration: 60 },
  { key: "pvt-s34", studentIdx: 34, tutorIdx: 2, tutorHourlyRate: 130, price: 400, sessionsPerMonth: 4, time: 16, duration: 60 },
  { key: "pvt-hist-s1", studentIdx: 1, tutorIdx: 9, tutorHourlyRate: 120, price: 300, sessionsPerMonth: 4, time: 13, duration: 60, active: false, historical: true },
];

const TRIAL_PRIVATE_DEFS: { studentIdx: number; tutorIdx: number }[] = [
  { studentIdx: 65, tutorIdx: 2 },
  { studentIdx: 66, tutorIdx: 5 },
  { studentIdx: 67, tutorIdx: 7 },
  { studentIdx: 68, tutorIdx: 9 },
];

// Featured students with hand-crafted financial scenarios.
const FEATURED_PLAN: Record<
  number,
  {
    prices: Record<string, number>;
    payments: { amount: number; method: number; split?: number[]; dateOffset?: number; groupKey?: string }[];
    pendingOutstanding?: boolean;
  }
> = {
  0: {
    prices: { "ar-egypt": 100, "en-us": 180, "math-egypt": 120 },
    payments: [
      { amount: 400, method: PaymentMethod.CASH, split: [100, 180, 120], dateOffset: 10 },
    ],
  },
  1: {
    prices: { "quran-tajweed": 500, "ar-nahw": 350 },
    payments: [
      { amount: 500, method: PaymentMethod.BANK_TRANSFER, dateOffset: 8, groupKey: "quran-tajweed" },
      { amount: 350, method: PaymentMethod.CASH, dateOffset: 8, groupKey: "ar-nahw" },
      { amount: 200, method: PaymentMethod.CARD, dateOffset: 4, groupKey: "pvt-s1" },
    ],
    pendingOutstanding: true,
  },
  2: {
    prices: { "pvt-s2": 500 },
    payments: [
      { amount: 200, method: PaymentMethod.CASH, dateOffset: 7 },
      { amount: 150, method: PaymentMethod.ONLINE, dateOffset: 4 },
    ],
    pendingOutstanding: true,
  },
  3: {
    prices: {},
    payments: [
      { amount: 200, method: PaymentMethod.CARD, split: [100, 60, 40], dateOffset: 6 },
    ],
    pendingOutstanding: true,
  },
  24: {
    prices: { "math-foundation": 240 },
    payments: [
      { amount: 240, method: PaymentMethod.CASH, dateOffset: 12 },
    ],
  },
};

const FEATURED_STUDENT_KEYS = Object.keys(FEATURED_PLAN).map(Number);

const DEEP_HISTORY_STUDENTS = [0, 1, 5, 6, 10, 11, 12, 20, 26, 30, 34, 40];
const CUSTOM_BILLING_STUDENTS = [10, 11, 12, 20, 30, 40, 50, 55];

const TOPICS = [
  "مراجعة عامة",
  "الوحدة الثالثة",
  "تدريبات شفهية",
  "شرح درس جديد",
  "حل الواجبات",
  "اختبار قصير",
  "قراءة وتفسير",
  "تمارين تطبيقية",
];

const EXCUSE_REASONS = ["مرض", "ظرف عائلي", "سفر", "موعد طبي"];

// ============================================================================
// Helpers
// ============================================================================

async function createBaseData() {
  await Promise.all([
    db.costCenter.create({ data: { title: "مرتبات المعلمين" } }),
    db.costCenter.create({ data: { title: "مرتبات الموظفين (غير المعلمين)" } }),
    db.costCenter.create({ data: { title: "الإعلانات" } }),
    db.costCenter.create({ data: { title: "تصوير المحتوى" } }),
    db.costCenter.create({ data: { title: "إشتراكات برامج" } }),
    db.costCenter.create({ data: { title: "ضرائب" } }),
    db.costCenter.create({ data: { title: "حوافز" } }),
    db.costCenter.create({ data: { title: "أخرى" } }),
  ]);

  const [sar, usd, egp] = await Promise.all([
    db.currency.create({ data: { code: "SAR", name: "ريال سعودي", symbol: "ر.س" } }),
    db.currency.create({ data: { code: "USD", name: "دولار أمريكي", symbol: "$" } }),
    db.currency.create({ data: { code: "EGP", name: "جنيه مصري", symbol: "ج.م" } }),
  ]);
  console.log("✅ Currencies created");

  await Promise.all([
    db.saasPlan.create({ data: { billingPeriod: 30, dollarPrice: 15, egyptianPrice: 30, maxStudents: 200, maxTutors: 200, name: "الخطة الأولي" } }),
    db.saasPlan.create({ data: { billingPeriod: 30, dollarPrice: 15, egyptianPrice: 30, maxStudents: 200, maxTutors: 200, name: "الخطة الثانية" } }),
    db.saasPlan.create({ data: { billingPeriod: 30, dollarPrice: 15, egyptianPrice: 30, maxStudents: 200, maxTutors: 200, name: "الخطة الثالثة" } }),
  ]);
  console.log("✅ Saas plans created");

  const specialities = await Promise.all(
    SPECIALITY_TITLES.map((title) => db.speciality.create({ data: { title } })),
  );
  const specialityByTitle = new Map(
    SPECIALITY_TITLES.map((t, i) => [t, specialities[i]]),
  );

  const superAdminUser = await db.user.create({
    data: {
      email: "mostafakamar.dev@gmail.com",
      password: await bcrypt.hash(PASSWORD_PLAIN, 10),
      name: "Super Admin: Mostaf Kamar",
      role: Role.SuperAdmin,
      phone: "+201018303125",
    },
  });
  await db.superAdmin.create({ data: { userId: superAdminUser.id } });
  console.log("✅ Super admin created");

  const academy = await db.academy.create({
    data: {
      name: ACADEMY_NAME,
      maxTutors: 30,
      maxStudents: 200,
      primaryColor: "#2E86AB",
      defaultCurrencyId: egp.id,
    },
  });

  await db.academyCurrencyRate.createMany({
    data: [
      { academyId: academy.id, currencyId: sar.id, rate: 13 },
      { academyId: academy.id, currencyId: usd.id, rate: 50 },
    ],
  });

  const adminUser = await db.user.create({
    data: {
      email: "demo.admin@academy.com",
      password: await bcrypt.hash(PASSWORD_PLAIN, 10),
      name: "أحمد مدير الأكاديمية",
      role: Role.Admin,
      phone: "+201018303125",
    },
  });
  await db.admin.create({ data: { userId: adminUser.id, academyId: academy.id } });
  console.log("✅ Academy + admin created");

  const supervisorNames = ["محمد المشرف", "سلمى المشرفة", "خالد المشرف"];
  const supervisors = [];
  for (let i = 0; i < supervisorNames.length; i++) {
    const u = await db.user.create({
      data: {
        email: `demo.supervisor${i + 1}@academy.com`,
        password: await bcrypt.hash(PASSWORD_PLAIN, 10),
        name: supervisorNames[i],
        role: Role.Supervisor,
        phone: "+201018303125",
      },
    });
    const s = await db.supervisor.create({ data: { userId: u.id, academyId: academy.id } });
    supervisors.push(s);
  }
  console.log(`✅ ${supervisors.length} supervisors created`);

  return { academy, adminUser, adminUserId: adminUser.id, supervisors, egp, sar, usd, specialityByTitle, salaryCostCenterId: undefined as number | undefined };
}

async function createPlans(base: Awaited<ReturnType<typeof createBaseData>>) {
  const plans = await Promise.all(
    PLAN_DEFS.map((p) =>
      db.plan.create({
        data: {
          title: p.title,
          sessionCount: p.sessionCount,
          price: p.price,
          billingPeriod: 30,
          currencyId: base.egp.id,
          academyId: base.academy.id,
        },
      }),
    ),
  );
  console.log(`✅ ${plans.length} plans created`);
  return plans;
}

type TutorRecord = {
  id: number;
  userId: number;
  name: string;
  subject: string;
  privateRate: number;
  groupRate: number;
  active: boolean;
  noRecent?: boolean;
};

async function createTutors(
  base: Awaited<ReturnType<typeof createBaseData>>,
  password: string,
): Promise<TutorRecord[]> {
  const records: TutorRecord[] = [];
  const zoomByTutor = new Map<number, string>();

  for (let i = 0; i < TUTOR_DEFS.length; i++) {
    const def = TUTOR_DEFS[i];
    const user = await db.user.create({
      data: {
        email: `tutor.demo${i + 1}@academy.com`,
        password,
        name: TUTOR_NAMES[i],
        role: Role.Tutor,
        phone: "+201018303125",
      },
    });
    const zoomAuthenticated = i % 3 !== 2;
    const zoomUrl = zoomAuthenticated
      ? `https://zoom.us/j/${82700000000 + i * 137}?pwd=seed${i + 1}`
      : null;
    const tutor = await db.tutor.create({
      data: {
        userId: user.id,
        academyId: base.academy.id,
        currencyId: base.egp.id,
        baseHourlyRate: def.privateRate,
        baseGroupHourlyRate: def.groupRate,
        active: true,
        bio: `${def.subject} — خبرة ${randomInt(3, 12)} سنوات`,
        qualifications: `إجازة في ${def.subject}`,
        zoomAuthenticated,
        zoomUrl,
        defaultSupervisorId: base.supervisors[i % base.supervisors.length].id,
        specialities: { connect: [{ id: base.specialityByTitle.get(def.subject)!.id }] },
      },
    });
    if (zoomUrl) zoomByTutor.set(tutor.id, zoomUrl);
    records.push({
      id: tutor.id,
      userId: user.id,
      name: TUTOR_NAMES[i],
      subject: def.subject,
      privateRate: def.privateRate,
      groupRate: def.groupRate,
      active: true,
    });
  }

  const noRecentUser = await db.user.create({
    data: { email: "tutor.demo13@academy.com", password, name: "طارق النجار", role: Role.Tutor, phone: "+201018303125" },
  });
  const noRecent = await db.tutor.create({
    data: {
      userId: noRecentUser.id,
      academyId: base.academy.id,
      currencyId: base.egp.id,
      baseHourlyRate: 140,
      baseGroupHourlyRate: 95,
      active: true,
      bio: "رياضيات — معلم قديم",
      defaultSupervisorId: base.supervisors[0].id,
      specialities: { connect: [{ id: base.specialityByTitle.get("الرياضيات")!.id }] },
    },
  });
  records.push({ id: noRecent.id, userId: noRecentUser.id, name: "طارق النجار", subject: "الرياضيات", privateRate: 140, groupRate: 95, active: true, noRecent: true });

  const inactiveUser = await db.user.create({
    data: { email: "tutor.demo14@academy.com", password, name: "رانيا القاضي", role: Role.Tutor, phone: "+201018303125" },
  });
  const inactive = await db.tutor.create({
    data: {
      userId: inactiveUser.id,
      academyId: base.academy.id,
      currencyId: base.egp.id,
      baseHourlyRate: 120,
      baseGroupHourlyRate: 80,
      active: false,
      bio: "إنجليزية — غير نشطة حالياً",
      defaultSupervisorId: base.supervisors[1].id,
      specialities: { connect: [{ id: base.specialityByTitle.get("اللغة الإنجليزية")!.id }] },
    },
  });
  records.push({ id: inactive.id, userId: inactiveUser.id, name: "رانيا القاضي", subject: "اللغة الإنجليزية", privateRate: 120, groupRate: 80, active: false });

  console.log(`✅ ${records.length} tutors created`);
  return records;
}

type StudentRecord = {
  id: number;
  userId: number;
  idx: number;
  name: string;
  status: number;
  currency: "EGP" | "SAR" | "USD";
  currencyId: number;
};

async function createStudents(
  base: Awaited<ReturnType<typeof createBaseData>>,
  password: string,
): Promise<StudentRecord[]> {
  const countries = ["مصر", "مصر", "مصر", "مصر", "السعودية", "السعودية", "الكويت", "الكويت", "الإمارات", "قطر", "الأردن", "ليبيا", "اليمن", "مصر", "مصر"];
  const students: StudentRecord[] = [];
  for (let i = 0; i < 75; i++) {
    const status =
      i < 60
        ? StudentStatus.subscribed
        : i < 65
          ? StudentStatus.lead
          : i < 69
            ? StudentStatus.trial
            : i < 72
              ? StudentStatus.churned
              : StudentStatus.paused;
    const currency: "EGP" | "SAR" | "USD" =
      i === 3 || i === 4 || i === 5 ? "SAR" : i === 6 || i === 7 || i === 8 ? "USD" : "EGP";
    const user = await db.user.create({
      data: {
        email: `student.demo${i + 1}@academy.com`,
        password,
        name: faker.person.fullName(),
        role: Role.Student,
        phone: faker.phone.number(),
        timezone: "Africa/Cairo",
        preferredLanguage: "ar",
      },
    });
    const country =
      i === 3 || i === 4 || i === 5
        ? "السعودية"
        : i === 6 || i === 7 || i === 8
          ? "الكويت"
          : countries[i % countries.length];
    const student = await db.student.create({
      data: {
        userId: user.id,
        academyId: base.academy.id,
        age: randomInt(6, 16),
        country,
        status,
        currencyId: currency === "SAR" ? base.sar.id : currency === "USD" ? base.usd.id : base.egp.id,
        source: i % 2 === 0 ? "إعلانات فيسبوك" : "ترشيح واتساب",
      },
    });
    students.push({ id: student.id, userId: user.id, idx: i, name: user.name ?? "", status, currency, currencyId: currency === "SAR" ? base.sar.id : currency === "USD" ? base.usd.id : base.egp.id });
  }

  for (const i of CUSTOM_BILLING_STUDENTS) {
    await db.student.update({
      where: { id: students[i].id },
      data: { billingDate: NOW.add(randomInt(5, 20), "day").toDate() },
    });
  }
  console.log(`✅ ${students.length} students created (${CUSTOM_BILLING_STUDENTS.length} with custom billing date)`);
  return students;
}

type GroupRecord = {
  id: number;
  key: string;
  title: string;
  tutorId: number;
  tutorHourlyRate: number;
  studentSessionPrice: number;
  time: number;
  weekdays: number[];
  duration: number;
  sessionsPerMonth: number;
  rateChange?: { fromOffsetDays: number; rate: number };
};

async function createGroups(
  base: Awaited<ReturnType<typeof createBaseData>>,
  tutors: TutorRecord[],
): Promise<Map<string, GroupRecord>> {
  const records = new Map<string, GroupRecord>();
  const all = [...CLASS_GROUP_DEFS, EMPTY_GROUP_DEF, ...INACTIVE_GROUP_DEFS];
  for (const def of all) {
    const tutor = tutors[def.tutorIdx];
    const g = await db.group.create({
      data: {
        title: def.title,
        academyId: base.academy.id,
        currentTutorId: tutor.id,
        tutorHourlyRate: def.tutorHourlyRate,
        studentSessionPrice: def.studentSessionPrice,
        active: def.active ?? true,
      },
    });
    records.set(def.key, {
      id: g.id,
      key: def.key,
      title: def.title,
      tutorId: tutor.id,
      tutorHourlyRate: def.tutorHourlyRate,
      studentSessionPrice: def.studentSessionPrice,
      time: def.time,
      weekdays: def.weekdays,
      duration: def.duration,
      sessionsPerMonth: def.sessionsPerMonth,
      rateChange: def.rateChange,
    });
  }
  console.log(`✅ ${records.size} groups created`);
  return records;
}

type Membership = {
  id: number;
  groupId: number;
  groupKey: string;
  studentIdx: number;
  studentId: number;
  studentName: string;
  currency: "EGP" | "SAR" | "USD";
  currencyId: number;
  joinedAt: dayjs.Dayjs;
  leftAt?: dayjs.Dayjs;
  active: boolean;
  customPrice?: number;
  kind: "class" | "private" | "trial" | "churned" | "paused" | "inactiveGroup";
};

function allocateSizes(declared: number[], total: number): number[] {
  const sum = declared.reduce((a, b) => a + b, 0);
  const sizes = declared.map((s) => Math.floor((s * total) / sum));
  const diff = total - sizes.reduce((a, b) => a + b, 0);
  const rem = declared
    .map((s, i) => ({ i, frac: (s * total) / sum - Math.floor((s * total) / sum) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < diff; k++) sizes[rem[k % rem.length].i]++;
  return sizes;
}

async function assignMemberships(
  base: Awaited<ReturnType<typeof createBaseData>>,
  students: StudentRecord[],
  tutors: TutorRecord[],
  groupRecords: Map<string, GroupRecord>,
) {
  const seeds: Record<number, string[]> = {
    0: ["ar-egypt", "en-us", "math-egypt"],
    1: ["quran-tajweed", "ar-nahw"],
    6: ["ar-egypt"],
    24: ["math-foundation"],
  };

  const targets = new Array<number>(60).fill(1);
  targets[0] = 3;
  targets[1] = 3;
  targets[2] = 2;
  targets[3] = 3;
  targets[4] = 3;
  targets[5] = 3;
  for (let i = 6; i <= 22; i++) targets[i] = 2;

  const assigned = new Map<number, string[]>();
  for (const [si, keys] of Object.entries(seeds)) assigned.set(Number(si), [...keys]);
  const remainingTargets = targets.map((t, i) => t - (seeds[i]?.length ?? 0));
  const totalRemaining = remainingTargets.reduce((a, b) => a + b, 0);
  const declaredSizes = CLASS_GROUP_DEFS.map((d) => d.size);
  const sizes = allocateSizes(declaredSizes, totalRemaining);

  CLASS_GROUP_DEFS.forEach((def, gi) => {
    let slots = sizes[gi];
    while (slots > 0) {
      let best = -1;
      let bestRem = -1;
      for (let i = 0; i < 60; i++) {
        const list = assigned.get(i) ?? [];
        if (list.includes(def.key)) continue;
        if (remainingTargets[i] <= 0) continue;
        if (remainingTargets[i] > bestRem) {
          best = i;
          bestRem = remainingTargets[i];
        }
      }
      if (best === -1) throw new Error(`Could not fill group ${def.key}`);
      const list = assigned.get(best) ?? [];
      list.push(def.key);
      assigned.set(best, list);
      remainingTargets[best]--;
      slots--;
    }
  });

  const memberships: Membership[] = [];

  const pushMembership = async (m: Omit<Membership, "id" | "studentId" | "studentName" | "currency" | "currencyId">) => {
    const s = students[m.studentIdx];
    const rec = await db.groupStudent.create({
      data: {
        groupId: m.groupId,
        studentId: s.id,
        active: m.active,
        joinedAt: m.joinedAt.toDate(),
        leftAt: m.leftAt?.toDate(),
        customSessionPrice: m.customPrice,
      },
    });
    memberships.push({
      ...m,
      id: rec.id,
      studentId: s.id,
      studentName: s.name,
      currency: s.currency,
      currencyId: s.currencyId,
    });
  };

  const classOrder: { key: string; def: ClassGroupDef }[] = CLASS_GROUP_DEFS.map((def) => ({ key: def.key, def }));
  const membersByGroup = new Map<string, number[]>();
  for (const { def } of classOrder) {
    const studentsInGroup: number[] = [];
    for (const [si, list] of assigned) {
      if (list.includes(def.key)) studentsInGroup.push(si);
    }
    membersByGroup.set(def.key, studentsInGroup);
  }

  for (const { def } of classOrder) {
    const group = groupRecords.get(def.key)!;
    const list = membersByGroup.get(def.key) ?? [];
    for (const si of list) {
      const joinedAt =
        def.membershipChanges === "addLater" && si === list[0]
          ? NOW.subtract(15, "day")
          : NOW.subtract(120, "day");
      await pushMembership({
        groupId: group.id,
        groupKey: def.key,
        studentIdx: si,
        joinedAt,
        active: true,
        kind: "class",
      });
    }
    if (def.membershipChanges === "someLeft" || def.membershipChanges === "both") {
      const leaveCount = def.membershipChanges === "someLeft" ? 2 : 1;
      for (let k = 0; k < leaveCount; k++) {
        const si = list[list.length - 1 - k];
        const member = memberships.find((m) => m.groupKey === def.key && m.studentIdx === si)!;
        await db.groupStudent.update({
          where: { id: member.id },
          data: { active: false, leftAt: NOW.subtract(30, "day").toDate() },
        });
        member.active = false;
        member.leftAt = NOW.subtract(30, "day");
      }
    }
  }

  const privateRecords: GroupRecord[] = [];
  for (const def of PRIVATE_GROUP_DEFS) {
    const s = students[def.studentIdx];
    const tutor = tutors[def.tutorIdx];
    const g = await db.group.create({
      data: {
        title: `خاص - ${s.name}`,
        academyId: base.academy.id,
        currentTutorId: tutor.id,
        tutorHourlyRate: def.tutorHourlyRate,
        studentSessionPrice: Math.round(def.price / def.sessionsPerMonth),
        active: def.active ?? true,
      },
    });
    privateRecords.push({
      id: g.id,
      key: def.key,
      title: g.title,
      tutorId: tutor.id,
      tutorHourlyRate: def.tutorHourlyRate,
      studentSessionPrice: Math.round(def.price / def.sessionsPerMonth),
      time: def.time,
      weekdays: [def.time % 7],
      duration: def.duration,
      sessionsPerMonth: def.sessionsPerMonth,
    });
    groupRecords.set(def.key, privateRecords[privateRecords.length - 1]);
    await pushMembership({
      groupId: g.id,
      groupKey: def.key,
      studentIdx: def.studentIdx,
      joinedAt: NOW.subtract(90, "day"),
      leftAt: def.historical ? NOW.subtract(60, "day") : undefined,
      active: def.historical ? false : true,
      customPrice: def.price,
      kind: "private",
    });
  }

  for (const def of TRIAL_PRIVATE_DEFS) {
    const s = students[def.studentIdx];
    const tutor = tutors[def.tutorIdx];
    const g = await db.group.create({
      data: {
        title: `خاص - ${s.name} (تجريبي)`,
        academyId: base.academy.id,
        currentTutorId: tutor.id,
        tutorHourlyRate: tutor.privateRate,
        studentSessionPrice: 0,
        active: true,
      },
    });
    groupRecords.set(`trial-${def.studentIdx}`, {
      id: g.id,
      key: `trial-${def.studentIdx}`,
      title: g.title,
      tutorId: tutor.id,
      tutorHourlyRate: tutor.privateRate,
      studentSessionPrice: 0,
      time: 16,
      weekdays: [def.studentIdx % 7],
      duration: 60,
      sessionsPerMonth: 4,
    });
    await pushMembership({
      groupId: g.id,
      groupKey: `trial-${def.studentIdx}`,
      studentIdx: def.studentIdx,
      joinedAt: NOW.subtract(10, "day"),
      active: true,
      kind: "trial",
    });
  }

  for (const def of INACTIVE_GROUP_DEFS) {
    const g = groupRecords.get(def.key)!;
    const candidates = students.filter((s) => s.status === StudentStatus.subscribed && s.idx % 3 !== 0).slice(0, def.size);
    for (const s of candidates) {
      const active = def.membershipsInactive ? false : true;
      await pushMembership({
        groupId: g.id,
        groupKey: def.key,
        studentIdx: s.idx,
        joinedAt: NOW.subtract(150, "day"),
        leftAt: def.membershipsInactive ? NOW.subtract(40, "day") : undefined,
        active,
        kind: "inactiveGroup",
      });
    }
  }

  const churnedIdx = [69, 70, 71];
  const churnedGroups = ["ar-egypt", "en-us", "math-egypt"];
  for (let k = 0; k < churnedIdx.length; k++) {
    const key = churnedGroups[k];
    const group = groupRecords.get(key)!;
    const si = churnedIdx[k];
    await pushMembership({
      groupId: group.id,
      groupKey: `${key}#churned${k}`,
      studentIdx: si,
      joinedAt: NOW.subtract(120, "day"),
      leftAt: NOW.subtract(20, "day"),
      active: false,
      kind: "churned",
    });
  }

  const pausedIdx = [72, 73, 74];
  const pausedGroups = ["ar-egypt", "math-foundation", "en-conv"];
  for (let k = 0; k < pausedIdx.length; k++) {
    const key = pausedGroups[k];
    const group = groupRecords.get(key)!;
    const si = pausedIdx[k];
    await pushMembership({
      groupId: group.id,
      groupKey: `${key}#paused${k}`,
      studentIdx: si,
      joinedAt: NOW.subtract(90, "day"),
      active: true,
      kind: "paused",
    });
  }

  console.log(`✅ ${memberships.length} memberships assigned (${groupRecords.size} groups total)`);
  return { memberships, privateRecords };
}

type SessionCtx = {
  academyId: number;
  adminUserId: number;
  supervisorByTutor: Map<number, number>;
  zoomByTutor: Map<number, string>;
  usageByGroup: Map<number, dayjs.Dayjs[]>;
  tutorEarned: Map<number, Map<string, number>>;
};

function rateForGroupAt(def: GroupRecord, date: dayjs.Dayjs) {
  if (def.rateChange && date.isAfter(NOW.subtract(def.rateChange.fromOffsetDays, "day"))) {
    return def.rateChange.rate;
  }
  return def.tutorHourlyRate;
}

function sessionDatesForMonth(def: GroupRecord, monthStart: dayjs.Dayjs, monthEnd: dayjs.Dayjs) {
  const occ = new Map<number, dayjs.Dayjs[]>();
  let d = monthStart;
  while (d.isBefore(monthEnd.add(1, "day"))) {
    if (def.weekdays.includes(d.day())) {
      const list = occ.get(d.day()) ?? [];
      list.push(d.hour(def.time).minute(0).second(0));
      occ.set(d.day(), list);
    }
    d = d.add(1, "day");
  }
  const dates: dayjs.Dayjs[] = [];
  for (const [, list] of occ) {
    if (def.sessionsPerMonth === 2) {
      if (list.length >= 1) dates.push(list[0]);
      if (list.length >= 3) dates.push(list[2]);
    } else {
      dates.push(...list);
    }
  }
  dates.sort((a, b) => a.valueOf() - b.valueOf());
  return dates;
}

async function createReport(participantId: number) {
  await db.sessionReport.create({
    data: {
      participantId,
      rating: randomInt(2, 5),
      outcomes: faker.lorem.sentence(),
      strengths: faker.lorem.sentence(),
      weaknesses: rng() > 0.5 ? faker.lorem.sentence() : undefined,
      nextGoals: faker.lorem.sentence(),
      comments: faker.lorem.paragraph(),
    },
  });
}

async function createSessionForGroup(
  ctx: SessionCtx,
  group: GroupRecord,
  memberships: Membership[],
  date: dayjs.Dayjs,
  opts: { isTrial?: boolean; attendanceOverride?: AttendanceStatus[] } = {},
) {
  const isTrial = opts.isTrial ?? false;
  const cancelled = !isTrial && date.isBefore(NOW) && rng() < 0.07;
  const rate = rateForGroupAt(group, date);
  const members = memberships
    .filter(
      (m) =>
        m.groupId === group.id &&
        m.joinedAt.isBefore(date.add(1, "day")) &&
        (!m.leftAt || m.leftAt.isAfter(date)),
    )
    .sort((a, b) => a.studentIdx - b.studentIdx);

  const session = await db.session.create({
    data: {
      startTime: date.toDate(),
      durationMinutes: group.duration,
      topic: TOPICS[randomInt(0, TOPICS.length - 1)],
      notes: rng() < 0.3 ? faker.lorem.sentence() : undefined,
      isTrial,
      tutorId: group.tutorId,
      tutorRate: rate,
      groupId: group.id,
      supervisorId: ctx.supervisorByTutor.get(group.tutorId) ?? ctx.supervisorByTutor.values().next().value!,
      academyId: ctx.academyId,
      zoomUrl: ctx.zoomByTutor.get(group.tutorId) ?? null,
      ...(cancelled ? { cancelledBy: ctx.adminUserId } : {}),
    },
  });

  for (let pi = 0; pi < members.length; pi++) {
    const m = members[pi];
    let att: AttendanceStatus | null = null;
    let reason: string | null = null;
    if (isTrial) {
      att = AttendanceStatus.ATTENDED;
    } else if (cancelled) {
      att = null;
    } else if (date.isBefore(NOW)) {
      if (opts.attendanceOverride && opts.attendanceOverride[pi] !== undefined) {
        att = opts.attendanceOverride[pi];
        if (att === AttendanceStatus.ABSENT_EXCUSED) reason = EXCUSE_REASONS[pi % EXCUSE_REASONS.length];
      } else {
        const r = rng();
        if (r < 0.6) att = AttendanceStatus.ATTENDED;
        else if (r < 0.72) att = AttendanceStatus.LATE;
        else if (r < 0.82) {
          att = AttendanceStatus.ABSENT_EXCUSED;
          reason = EXCUSE_REASONS[randomInt(0, EXCUSE_REASONS.length - 1)];
        } else if (r < 0.94) att = AttendanceStatus.ABSENT_UNEXCUSED;
      }
    }

    const participant = await db.sessionParticipant.create({
      data: {
        sessionId: session.id,
        studentId: m.studentId,
        studentAttendanceStatus: att,
        reason,
        price: isTrial ? 0 : (m.customPrice ?? group.studentSessionPrice ?? 0),
        paymentStatus: 0,
      },
    });

    if (att === AttendanceStatus.ATTENDED || att === AttendanceStatus.LATE) {
      if (rng() < 0.8) await createReport(participant.id);
    }
  }

  if (!cancelled && date.isBefore(NOW)) {
    if (!isTrial) {
      const list = ctx.usageByGroup.get(group.id) ?? [];
      list.push(date);
      ctx.usageByGroup.set(group.id, list);
    }
    const earned = (rate * group.duration) / 60;
    const mkey = monthKey(date);
    const byMonth = ctx.tutorEarned.get(group.tutorId) ?? new Map<string, number>();
    byMonth.set(mkey, (byMonth.get(mkey) ?? 0) + earned);
    ctx.tutorEarned.set(group.tutorId, byMonth);
  }

  return session;
}

async function createSessions(
  base: Awaited<ReturnType<typeof createBaseData>>,
  tutors: TutorRecord[],
  memberships: Membership[],
  groupRecords: Map<string, GroupRecord>,
) {
  const ctx: SessionCtx = {
    academyId: base.academy.id,
    adminUserId: base.adminUserId,
    supervisorByTutor: new Map(),
    zoomByTutor: new Map(),
    usageByGroup: new Map(),
    tutorEarned: new Map(),
  };
  for (const [i, t] of tutors.entries()) {
    ctx.supervisorByTutor.set(t.id, base.supervisors[i % base.supervisors.length].id);
  }

  for (const def of CLASS_GROUP_DEFS) {
    const group = groupRecords.get(def.key)!;
    ctx.usageByGroup.set(group.id, []);
    for (let m = 4; m >= 0; m--) {
      const monthStart = NOW.subtract(m, "month").startOf("month");
      const monthEnd = m === 0 ? NOW.subtract(1, "day") : monthStart.endOf("month");
      if (monthEnd.isBefore(monthStart)) continue;
      const dates = sessionDatesForMonth(group, monthStart, monthEnd);
      for (const date of dates) {
        const isLastPast = m === 0 && date === dates[dates.length - 1];
        const override =
          def.key === "ar-egypt" && isLastPast
            ? [AttendanceStatus.ATTENDED, AttendanceStatus.ATTENDED, AttendanceStatus.ABSENT_UNEXCUSED, AttendanceStatus.ABSENT_EXCUSED, AttendanceStatus.ATTENDED, AttendanceStatus.LATE, AttendanceStatus.ATTENDED]
            : undefined;
        await createSessionForGroup(ctx, group, memberships, date, { attendanceOverride: override });
      }
    }
  }

  const noRecentTutor = tutors.find((t) => t.noRecent)!;
  const oldGroup = await db.group.create({
    data: {
      title: "رياضيات - مجموعة قديمة",
      academyId: base.academy.id,
      currentTutorId: noRecentTutor.id,
      tutorHourlyRate: 95,
      studentSessionPrice: 80,
      active: false,
    },
  });
  const oldMember = await db.groupStudent.create({
    data: { groupId: oldGroup.id, studentId: (memberships[0] as Membership).studentId, active: false, joinedAt: NOW.subtract(420, "day").toDate(), leftAt: NOW.subtract(330, "day").toDate() },
  });
  const oldDef: GroupRecord = {
    id: oldGroup.id,
    key: "old-group",
    title: "رياضيات - مجموعة قديمة",
    tutorId: noRecentTutor.id,
    tutorHourlyRate: 95,
    studentSessionPrice: 80,
    time: 16,
    weekdays: [2],
    duration: 90,
    sessionsPerMonth: 4,
  };
  ctx.usageByGroup.set(oldGroup.id, []);
  const oldMembership: Membership = {
    id: oldMember.id,
    groupId: oldGroup.id,
    groupKey: "old-group",
    studentIdx: memberships[0].studentIdx,
    studentId: memberships[0].studentId,
    studentName: memberships[0].studentName,
    currency: memberships[0].currency,
    currencyId: memberships[0].currencyId,
    joinedAt: NOW.subtract(420, "day"),
    leftAt: NOW.subtract(330, "day"),
    active: false,
    kind: "churned",
  };
  for (let m = 14; m >= 13; m--) {
    const monthStart = NOW.subtract(m, "month").startOf("month");
    const monthEnd = monthStart.endOf("month");
    for (const date of sessionDatesForMonth(oldDef, monthStart, monthEnd)) {
      await createSessionForGroup(ctx, oldDef, [oldMembership], date);
    }
  }

  for (const def of PRIVATE_GROUP_DEFS) {
    const group = groupRecords.get(def.key)!;
    ctx.usageByGroup.set(group.id, []);
    const months = def.historical ? [4, 3, 2] : [3, 2, 1, 0];
    for (const m of months) {
      const monthStart = NOW.subtract(m, "month").startOf("month");
      const monthEnd = m === 0 ? NOW.subtract(1, "day") : monthStart.endOf("month");
      if (monthEnd.isBefore(monthStart)) continue;
      for (const date of sessionDatesForMonth(group, monthStart, monthEnd)) {
        await createSessionForGroup(ctx, group, memberships, date);
      }
    }
  }

  for (const def of INACTIVE_GROUP_DEFS) {
    const group = groupRecords.get(def.key)!;
    ctx.usageByGroup.set(group.id, []);
    for (let m = 5; m >= 2; m--) {
      const monthStart = NOW.subtract(m, "month").startOf("month");
      const monthEnd = monthStart.endOf("month");
      for (const date of sessionDatesForMonth(group, monthStart, monthEnd)) {
        await createSessionForGroup(ctx, group, memberships, date);
      }
    }
  }

  for (let k = 0; k < 4; k++) {
    const def = TRIAL_PRIVATE_DEFS[k];
    const group = groupRecords.get(`trial-${def.studentIdx}`)!;
    ctx.usageByGroup.set(group.id, []);
    const trialDate = NOW.subtract(randomInt(3, 9), "day").hour(randomInt(10, 20));
    await createSessionForGroup(ctx, group, memberships, trialDate, { isTrial: true });
  }

  const todayGroups = ["ar-egypt", "math-egypt", "quran-tajweed"];
  const todayTimes = [16, 18, 20];
  for (let i = 0; i < todayGroups.length; i++) {
    const group = groupRecords.get(todayGroups[i])!;
    const date = NOW.hour(todayTimes[i]).minute(0).second(0);
    if (date.isBefore(NOW)) {
      await createSessionForGroup(ctx, group, memberships, NOW.hour(todayTimes[i] + 2).minute(0));
    } else {
      await createSessionForGroup(ctx, group, memberships, date);
    }
  }

  const futureKeys = [...CLASS_GROUP_DEFS.map((d) => d.key)];
  for (let day = 1; day <= 14; day++) {
    const key = futureKeys[(day * 3) % futureKeys.length];
    const group = groupRecords.get(key)!;
    const date = NOW.add(day, "day").hour(group.time).minute(0).second(0);
    await createSessionForGroup(ctx, group, memberships, date);
  }

  const sameDayTutors = [2, 4, 0];
  for (const ti of sameDayTutors) {
    const tutor = tutors[ti];
    const tutorGroups = [...groupRecords.values()].filter((g) => g.tutorId === tutor.id && g.key !== "old-group" && g.time !== 8);
    const day = NOW.subtract(randomInt(8, 12), "day");
    for (const g of tutorGroups.slice(0, 3)) {
      const date = day.hour(g.time).minute(0).second(0);
      if (date.isBefore(NOW)) {
        await createSessionForGroup(ctx, g, memberships, date);
      }
    }
  }

  const totalSessions = await db.session.count({ where: { academyId: base.academy.id } });
  console.log(`✅ ${totalSessions} sessions created`);
  return ctx;
}

// ============================================================================
// Subscriptions + revenues
// ============================================================================

type SubSpec = {
  scenario: string;
  price: number;
  sessionCount: number | null;
  billingOffset: number;
  cycles: number;
  planId: number | null;
  currencyId: number;
  payFraction?: number;
  payments?: { amount: number; method: number; dateOffset?: number; split?: number[] }[];
  pendingOutstanding?: boolean;
};

const SCENARIO_POOL: string[] = shuffle([
  ...new Array<string>(12).fill("overdue"),
  ...new Array<string>(9).fill("partial"),
  ...new Array<string>(7).fill("unpaid"),
  ...new Array<string>(3).fill("dueToday"),
  ...new Array<string>(6).fill("upcoming"),
  ...new Array<string>(8).fill("exhausted"),
  ...new Array<string>(3).fill("overUsed"),
  ...new Array<string>(4).fill("lowUse0"),
  ...new Array<string>(4).fill("lowUse25"),
  ...new Array<string>(3).fill("lowUse75"),
  ...new Array<string>(4).fill("cancelled"),
  ...new Array<string>(2).fill("pending"),
  ...new Array<string>(4).fill("expiredOnly"),
  ...new Array<string>(3).fill("noSub"),
  ...new Array<string>(5).fill("paid"),
]);

function billingOffsetFor(scenario: string, idx: number): number {
  switch (scenario) {
    case "partial":
      return [-3, -7, 7][idx % 3];
    case "unpaid":
      return [3, 7, 10][idx % 3];
    case "overdue":
      return [-3, -5, -7, -10, -14, -21][idx % 6];
    case "dueToday":
      return 0;
    case "upcoming":
      return [2, 3, 4, 5, 6][idx % 5];
    case "cancelled":
    case "paused":
    case "ended":
      return 15;
    case "pending":
      return 10;
    default:
      return [10, 15, 20, 25, 30][idx % 5];
  }
}

async function createSubscriptionsAndRevenues(
  base: Awaited<ReturnType<typeof createBaseData>>,
  plans: { id: number; sessionCount: number; price: number }[],
  memberships: Membership[],
  ctx: SessionCtx,
  students: StudentRecord[],
) {
  const deepHistory = new Set(DEEP_HISTORY_STUDENTS);
  const spreadBilling = new Map<number, number[]>([
    [10, [3, 7, 14]],
    [11, [3, 7, 14]],
    [12, [3, 7, 14]],
    [13, [5, 15, 25]],
  ]);

  const featuredPrices = (studentIdx: number) => FEATURED_PLAN[studentIdx]?.prices ?? {};
  let poolIdx = 0;
  let revenueCount = 0;

  const createRevenue = async (
    studentId: number,
    amount: number,
    currencyId: number,
    dueDate: dayjs.Dayjs,
    subscriptionId: number | null,
    planId: number | null,
    description: string,
    status: number,
    method?: number | null,
  ) => {
    await db.revenue.create({
      data: {
        amount,
        currencyId,
        status,
        method: method ?? null,
        dueDate: dueDate.toDate(),
        description,
        academyId: base.academy.id,
        studentId,
        planId,
        subscriptionId,
        recordedBy: base.adminUserId,
      },
    });
    revenueCount++;
  };

  const countInWindow = (groupId: number, from: dayjs.Dayjs, to: dayjs.Dayjs) => {
    const times = ctx.usageByGroup.get(groupId) ?? [];
    return times.filter((t) => !t.isBefore(from) && !t.isAfter(to) && !t.isAfter(NOW)).length;
  };

  const defaultMethod = () => {
    const methods = [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.ONLINE];
    return methods[randomInt(0, methods.length - 1)];
  };

  for (const m of memberships) {
    const featured = FEATURED_PLAN[m.studentIdx];
    const prices = featuredPrices(m.studentIdx);
    const isFeaturedMembership =
      !!featured && (Object.keys(prices).length === 0 || prices[m.groupKey] !== undefined);

    let scenario = "paid";
    let price = m.customPrice ?? 0;
    let plan = plans[m.studentIdx % plans.length];
    let cycles = deepHistory.has(m.studentIdx) ? randomInt(4, 5) : randomInt(1, 3);

    if (m.kind === "trial") {
      continue;
    }
    if (m.kind === "churned" || (m.kind === "inactiveGroup" && !m.active) || (m.kind === "private" && !m.active)) {
      scenario = "ended";
      cycles = Math.min(cycles, 2);
    } else if (m.kind === "paused") {
      scenario = "paused";
    } else if (m.kind === "inactiveGroup") {
      scenario = "paid";
    }

    if (m.kind === "class" || m.kind === "private" || (m.kind === "inactiveGroup" && m.active)) {
      if (scenario === "ended" || scenario === "paused") {
        price = m.customPrice ?? plan.price;
      } else if (isFeaturedMembership && prices[m.groupKey] !== undefined) {
        price = prices[m.groupKey];
        scenario = "featured";
      } else if (m.customPrice) {
        price = m.customPrice;
        plan = plans[m.studentIdx % plans.length];
        scenario = "featured";
      } else {
        price = plan.price;
        const isFeaturedStudent = FEATURED_STUDENT_KEYS.includes(m.studentIdx) && Object.keys(prices).length === 0;
        if (m.kind === "inactiveGroup") {
          scenario = "paid";
        } else if (!isFeaturedStudent) {
          scenario = SCENARIO_POOL[poolIdx % SCENARIO_POOL.length];
          poolIdx++;
        } else {
          scenario = "featured";
        }
      }
    }

    const spreadOffsets = spreadBilling.get(m.studentIdx);
    if (spreadOffsets && (m.kind === "class" || m.kind === "private")) {
      const spreadKeys = memberships
        .filter((x) => x.studentIdx === m.studentIdx && x.active)
        .map((x) => x.groupKey);
      const spreadIdx = spreadKeys.indexOf(m.groupKey);
      if (spreadIdx >= 0) {
        scenario = "paid";
        if (m.kind === "class") price = plan.price;
      }
    }

    if (m.kind === "class" || m.kind === "private" || (m.kind === "inactiveGroup" && m.active)) {
      const memberSpread = spreadBilling.get(m.studentIdx);
      const billingOffset =
        scenario === "featured"
          ? 15
          : memberSpread
            ? (memberSpread[memberships.filter((x) => x.studentIdx === m.studentIdx && x.active).map((x) => x.groupKey).indexOf(m.groupKey)] ?? 15)
            : billingOffsetFor(scenario, m.studentIdx);

      const spec: SubSpec = {
        scenario,
        price,
        sessionCount: scenario === "paid" && m.studentIdx % 9 === 0 ? null : plan.sessionCount,
        billingOffset,
        cycles,
        planId: plan.id,
        currencyId: m.currencyId,
        payFraction: scenario === "partial" ? [0.4, 0.55, 0.7, 0.85][m.studentIdx % 4] : undefined,
      };

      const cancelledDates = ["cancelled", "paused", "ended"].includes(scenario);
      const billing = cancelledDates ? NOW.subtract(10, "day") : NOW.add(spec.billingOffset, "day");
      const start = billing.subtract(30, "day");
      const end = billing;

      for (let k = spec.cycles; k >= 1; k--) {
        const hStart = NOW.subtract(k * 30 + 10, "day").startOf("day");
        const hEnd = hStart.add(30, "day");
        const hSub = await db.subscription.create({
          data: {
            groupStudentId: m.id,
            planId: spec.planId,
            price: spec.price,
            currencyId: spec.currencyId,
            sessionCount: spec.sessionCount,
            billingCycle: 30,
            startDate: hStart.toDate(),
            endDate: hEnd.toDate(),
            nextBillingDate: hEnd.toDate(),
            status: SubscriptionStatus.expired,
          },
        });
        await createRevenue(
          m.studentId,
          spec.price,
          spec.currencyId,
          hStart,
          hSub.id,
          spec.planId,
          `اشتراك ${hStart.format("MMMM YYYY")}`,
          PaymentStatus.PAID,
          defaultMethod(),
        );
      }

      if (scenario === "expiredOnly" || scenario === "noSub") continue;

      const subStatus =
        scenario === "cancelled" || scenario === "paused" || scenario === "ended"
          ? SubscriptionStatus.cancelled
          : scenario === "pending"
            ? SubscriptionStatus.pending
            : SubscriptionStatus.active;

      let sessionCount = spec.sessionCount;
      if (["exhausted", "overUsed", "lowUse0", "lowUse25", "lowUse75"].includes(scenario)) {
        const S = countInWindow(m.groupId, start, end);
        switch (scenario) {
          case "exhausted":
            sessionCount = Math.max(1, S);
            break;
          case "overUsed":
            sessionCount = Math.max(1, S - 2);
            break;
          case "lowUse0":
            sessionCount = S + 8;
            break;
          case "lowUse25":
            sessionCount = Math.max(4, Math.ceil(S * 4));
            break;
          case "lowUse75":
            sessionCount = Math.max(4, Math.ceil(S / 0.75));
            break;
        }
      }

      const sub = await db.subscription.create({
        data: {
          groupStudentId: m.id,
          planId: spec.planId,
          price: spec.price,
          currencyId: spec.currencyId,
          sessionCount,
          billingCycle: 30,
          startDate: start.toDate(),
          endDate: end.toDate(),
          nextBillingDate: end.toDate(),
          status: subStatus,
        },
      });

      if (scenario === "paid" || scenario === "featured") {
        if (scenario === "featured" && featured) {
          const featuredPayments = featured.payments ?? [];
          const targeted = featuredPayments.filter((p) => p.groupKey && p.groupKey === m.groupKey);
          const shared = featuredPayments.filter((p) => !p.groupKey && !p.split);
          const splitPayment = featuredPayments.find((p) => p.split);
          const membersKeys = memberships
            .filter((x) => x.studentIdx === m.studentIdx && x.active)
            .map((x) => x.groupKey);
          const myShare = splitPayment?.split ? (splitPayment.split[membersKeys.indexOf(m.groupKey)] ?? 0) : 0;
          if (myShare > 0) {
            await createRevenue(
              m.studentId,
              myShare,
              spec.currencyId,
              NOW.add(splitPayment!.dateOffset ?? 10, "day"),
              sub.id,
              spec.planId,
              "دفعة موحدة تغطي عدة اشتراكات",
              PaymentStatus.PAID,
              splitPayment!.method,
            );
          }
          for (const p of [...targeted, ...shared]) {
            await createRevenue(
              m.studentId,
              p.amount,
              spec.currencyId,
              NOW.add(p.dateOffset ?? 10, "day"),
              sub.id,
              spec.planId,
              `دفعة اشتراك ${spec.price} EGP`,
              PaymentStatus.PAID,
              p.method,
            );
          }
          if (featured.pendingOutstanding) {
            const paidAmounts = [...targeted, ...shared].reduce((a, p) => a + p.amount, 0) + myShare;
            const outstanding = Math.max(0, spec.price - paidAmounts);
            if (outstanding > 0) {
              await createRevenue(
                m.studentId,
                outstanding,
                spec.currencyId,
                billing,
                sub.id,
                spec.planId,
                "رصيد مستحق على الاشتراك",
                PaymentStatus.PENDING,
                null,
              );
            }
          }
        } else {
          const twoPayments = m.studentIdx % 7 === 0;
          const failedAttempt = m.studentIdx % 11 === 0;
          if (failedAttempt) {
            await createRevenue(
              m.studentId,
              Math.round(spec.price * 0.5),
              spec.currencyId,
              NOW.add(spec.billingOffset - 2, "day"),
              sub.id,
              spec.planId,
              "محاولة دفع فاشلة",
              PaymentStatus.FAILED,
              PaymentMethod.CARD,
            );
          }
          if (twoPayments) {
            const first = Math.round(spec.price * 0.6);
            await createRevenue(m.studentId, first, spec.currencyId, NOW.add(spec.billingOffset - 5, "day"), sub.id, spec.planId, `دفعة أولى للاشتراك`, PaymentStatus.PAID, defaultMethod());
            await createRevenue(m.studentId, spec.price - first, spec.currencyId, NOW.add(spec.billingOffset - 1, "day"), sub.id, spec.planId, "دفعة مكملة للاشتراك", PaymentStatus.PAID, defaultMethod());
          } else {
            await createRevenue(m.studentId, spec.price, spec.currencyId, NOW.add(spec.billingOffset - 5, "day"), sub.id, spec.planId, `دفعة اشتراك ${spec.price}`, PaymentStatus.PAID, defaultMethod());
          }
          if (m.studentIdx % 13 === 0) {
            await createRevenue(
              m.studentId,
              Math.round(spec.price * 0.25),
              spec.currencyId,
              NOW.subtract(35, "day"),
              sub.id,
              spec.planId,
              "دفعة مستردة",
              PaymentStatus.REFUNDED,
              PaymentMethod.ONLINE,
            );
          }
        }
      } else if (scenario === "partial") {
        const paidAmount = Math.round(spec.price * (spec.payFraction ?? 0.6));
        await createRevenue(m.studentId, paidAmount, spec.currencyId, NOW.add(spec.billingOffset - 3, "day"), sub.id, spec.planId, "دفعة جزئية للاشتراك", PaymentStatus.PAID, defaultMethod());
        await createRevenue(m.studentId, spec.price - paidAmount, spec.currencyId, billing, sub.id, spec.planId, "رصيد مستحق على الاشتراك", PaymentStatus.PENDING, null);
      } else if (
        scenario === "unpaid" ||
        scenario === "overdue" ||
        scenario === "dueToday" ||
        scenario === "upcoming" ||
        scenario === "pending"
      ) {
        await createRevenue(m.studentId, spec.price, spec.currencyId, billing, sub.id, spec.planId, "فاتورة اشتراك مستحقة", PaymentStatus.PENDING, null);
      } else if (scenario === "exhausted" || scenario === "overUsed" || scenario === "lowUse0" || scenario === "lowUse25" || scenario === "lowUse75") {
        const fullyPaid = m.studentIdx % 3 !== 0;
        if (fullyPaid) {
          await createRevenue(m.studentId, spec.price, spec.currencyId, NOW.add(spec.billingOffset - 5, "day"), sub.id, spec.planId, `دفعة اشتراك ${spec.price}`, PaymentStatus.PAID, defaultMethod());
        } else {
          const paidAmount = Math.round(spec.price * 0.5);
          await createRevenue(m.studentId, paidAmount, spec.currencyId, NOW.add(spec.billingOffset - 3, "day"), sub.id, spec.planId, "دفعة جزئية للاشتراك", PaymentStatus.PAID, defaultMethod());
          await createRevenue(m.studentId, spec.price - paidAmount, spec.currencyId, billing, sub.id, spec.planId, "رصيد مستحق على الاشتراك", PaymentStatus.PENDING, null);
        }
      }
    } else {
      if (m.kind === "paused" || m.kind === "churned" || (m.kind === "inactiveGroup" && !m.active)) {
        for (let k = cycles; k >= 1; k--) {
          const hStart = NOW.subtract(k * 30 + 10, "day").startOf("day");
          const hEnd = hStart.add(30, "day");
          const hSub = await db.subscription.create({
            data: {
              groupStudentId: m.id,
              planId: plans[0].id,
              price: 0,
              currencyId: m.currencyId,
              sessionCount: 2,
              billingCycle: 30,
              startDate: hStart.toDate(),
              endDate: hEnd.toDate(),
              nextBillingDate: hEnd.toDate(),
              status: SubscriptionStatus.expired,
            },
          });
          await createRevenue(m.studentId, 0, m.currencyId, hStart, hSub.id, plans[0].id, "اشتراك سابق", PaymentStatus.PAID, defaultMethod());
        }
        await db.subscription.create({
          data: {
            groupStudentId: m.id,
            planId: plans[0].id,
            price: 0,
            currencyId: m.currencyId,
            sessionCount: 2,
            billingCycle: 30,
            startDate: NOW.subtract(40, "day").toDate(),
            endDate: NOW.subtract(10, "day").toDate(),
            nextBillingDate: NOW.subtract(10, "day").toDate(),
            status: SubscriptionStatus.cancelled,
          },
        });
      }
    }
  }

  void students;
  const totalSubs = await db.subscription.count({ where: { groupStudent: { student: { academyId: base.academy.id } } } });
  console.log(`✅ ${totalSubs} subscriptions, ${revenueCount} revenues created`);
  return ctx;
}

// ============================================================================
// Tutor payments (Expenses)
// ============================================================================

async function createTutorPayments(
  base: Awaited<ReturnType<typeof createBaseData>>,
  tutors: TutorRecord[],
  ctx: SessionCtx,
) {
  const salaryCostCenter = await db.costCenter.findFirst({
    where: { title: "مرتبات المعلمين" },
  });
  base.salaryCostCenterId = salaryCostCenter?.id;
  const costCenterId = salaryCostCenter?.id ?? null;

  const fullyPaid = new Set<number>();
  const batched = new Set<number>();
  const partial = new Set<number>();
  const pendingOnly = new Set<number>();

  for (const [i, t] of tutors.entries()) {
    if (t.noRecent || !t.active) continue;
    if ([1, 3, 9].includes(i)) fullyPaid.add(t.id);
    if ([5, 8].includes(i)) batched.add(t.id);
    if ([0, 2, 4].includes(i)) partial.add(t.id);
    if ([6, 7].includes(i)) pendingOnly.add(t.id);
  }

  for (const t of tutors) {
    const byMonth = ctx.tutorEarned.get(t.id) ?? new Map<string, number>();
    const months = [...byMonth.keys()].sort();
    for (const mkey of months) {
      const earned = byMonth.get(mkey) ?? 0;
      if (earned <= 0) continue;
      const monthDate = dayjs.utc(`${mkey}-01`);
      const payDate = monthDate.endOf("month");

      if (pendingOnly.has(t.id)) {
        await db.expense.create({
          data: {
            date: payDate.toDate(),
            description: `مستحقات معلم ${t.name} — ${monthDate.format("MMMM YYYY")}`,
            amount: Math.round(earned),
            currencyId: base.egp.id,
            costCenterId,
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PENDING,
            tutorId: t.id,
            salaryMonth: mkey,
            academyId: base.academy.id,
            recordedBy: base.adminUserId,
          },
        });
        continue;
      }

      if (partial.has(t.id)) {
        const fraction = mkey === monthKey(NOW) ? 0.4 : 0.65;
        const paid = Math.round(earned * fraction);
        await db.expense.create({
          data: {
            date: payDate.toDate(),
            description: `دفعة جزئية للمعلم ${t.name} — ${monthDate.format("MMMM YYYY")}`,
            amount: paid,
            currencyId: base.egp.id,
            costCenterId,
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PAID,
            tutorId: t.id,
            salaryMonth: mkey,
            academyId: base.academy.id,
            recordedBy: base.adminUserId,
          },
        });
        if (mkey !== monthKey(NOW)) {
          await db.expense.create({
            data: {
              date: payDate.add(5, "day").toDate(),
              description: `دفعة مكملة للمعلم ${t.name} — ${monthDate.format("MMMM YYYY")}`,
              amount: earned - paid,
              currencyId: base.egp.id,
              costCenterId,
              method: PaymentMethod.BANK_TRANSFER,
              status: PaymentStatus.PENDING,
              tutorId: t.id,
              salaryMonth: mkey,
              academyId: base.academy.id,
              recordedBy: base.adminUserId,
            },
          });
        }
        continue;
      }

      if (batched.has(t.id)) {
        const first = Math.round(earned * 0.5);
        await db.expense.create({
          data: {
            date: payDate.subtract(10, "day").toDate(),
            description: `دفعة أولى للمعلم ${t.name} — ${monthDate.format("MMMM YYYY")}`,
            amount: first,
            currencyId: base.egp.id,
            costCenterId,
            method: PaymentMethod.CASH,
            status: PaymentStatus.PAID,
            tutorId: t.id,
            salaryMonth: mkey,
            academyId: base.academy.id,
            recordedBy: base.adminUserId,
          },
        });
        await db.expense.create({
          data: {
            date: payDate.toDate(),
            description: `دفعة ثانية للمعلم ${t.name} — ${monthDate.format("MMMM YYYY")}`,
            amount: earned - first,
            currencyId: base.egp.id,
            costCenterId,
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PAID,
            tutorId: t.id,
            salaryMonth: mkey,
            academyId: base.academy.id,
            recordedBy: base.adminUserId,
          },
        });
        continue;
      }

      if (fullyPaid.has(t.id)) {
        await db.expense.create({
          data: {
            date: payDate.toDate(),
            description: `راتب المعلم ${t.name} — ${monthDate.format("MMMM YYYY")}`,
            amount: Math.round(earned),
            currencyId: base.egp.id,
            costCenterId,
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PAID,
            tutorId: t.id,
            salaryMonth: mkey,
            academyId: base.academy.id,
            recordedBy: base.adminUserId,
          },
        });
      }
    }
  }

  const totalExpenses = await db.expense.count({ where: { academyId: base.academy.id } });
  console.log(`✅ ${totalExpenses} tutor payment expenses created`);
}

// ============================================================================
// Extras: attendance reviews, chat, notes, history, availabilities, homework
// ============================================================================

async function createExtras(
  base: Awaited<ReturnType<typeof createBaseData>>,
  students: StudentRecord[],
  tutors: TutorRecord[],
  memberships: Membership[],
) {
  const pastSessions = await db.session.findMany({
    where: { academyId: base.academy.id, startTime: { lte: NOW.toDate() }, cancelledBy: null },
    select: { id: true, supervisorId: true, startTime: true },
    orderBy: { id: "asc" },
    take: 40,
  });
  const reviewed = pastSessions.filter((_, i) => i % 2 === 0).slice(0, 20);
  for (const s of reviewed) {
    await db.tutorAttendance.create({
      data: {
        sessionId: s.id,
        status: reviewed.indexOf(s) % 5 === 0 ? 1 : 0,
        notes: reviewed.indexOf(s) % 5 === 0 ? "تأخر المعلم عن الحصة" : null,
        reviewedBy: s.supervisorId,
        reviewedAt: dayjs(s.startTime).add(1, "day").toDate(),
      },
    });
  }

  const activeMemberships = memberships.filter((m) => m.active && m.studentIdx < 60);
  const rooms = new Map<string, { tutorUserId: number; studentUserId: number }>();

  const tutorByGroup = new Map<number, TutorRecord>();
  for (const m of memberships) {
    const g = await db.group.findUnique({ where: { id: m.groupId }, select: { currentTutorId: true } });
    if (g) {
      const t = tutors.find((x) => x.id === g.currentTutorId);
      if (t) tutorByGroup.set(m.groupId, t);
    }
  }

  for (const m of activeMemberships) {
    const tutor = tutorByGroup.get(m.groupId);
    if (!tutor) continue;
    const key = `${tutor.userId}:${students[m.studentIdx].userId}`;
    if (rooms.has(key)) continue;
    rooms.set(key, { tutorUserId: tutor.userId, studentUserId: students[m.studentIdx].userId });
  }

  for (const [key, room] of rooms) {
    const roomRec = await db.chatRoom.upsert({
      where: { tutorUserId_studentUserId: { tutorUserId: room.tutorUserId, studentUserId: room.studentUserId } },
      update: {},
      create: {
        tutorUserId: room.tutorUserId,
        studentUserId: room.studentUserId,
        academyId: base.academy.id,
      },
    });
    const messageCount = randomInt(4, 12);
    const messages = [];
    for (let i = 0; i < messageCount; i++) {
      const senderId = i % 2 === 0 ? room.tutorUserId : room.studentUserId;
      const createdAt = NOW.subtract(randomInt(1, 30), "day").add(randomInt(0, 20), "hour");
      messages.push({
        roomId: roomRec.id,
        senderId,
        content: faker.lorem.sentence(),
        isRead: true,
        createdAt: createdAt.toDate(),
        updatedAt: createdAt.toDate(),
      });
    }
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    await db.chatMessage.createMany({ data: messages });
    void key;
  }

  const noteStudents = shuffle(students.filter((s) => s.status === StudentStatus.subscribed).slice(0, 25));
  for (const s of noteStudents.slice(0, 15)) {
    await db.note.create({
      data: {
        content: faker.lorem.paragraph(),
        targetType: TargetType.Student,
        targetId: s.id,
        authorId: base.adminUserId,
        studentId: s.id,
      },
    });
  }
  for (const t of tutors.slice(0, 6)) {
    await db.note.create({
      data: {
        content: faker.lorem.paragraph(),
        targetType: TargetType.Tutor,
        targetId: t.id,
        authorId: base.adminUserId,
        tutorId: t.id,
      },
    });
  }

  for (const s of students) {
    if (s.status === StudentStatus.lead) {
      await db.history.create({
        data: {
          targetType: TargetType.Student,
          targetId: s.id,
          action: HistoryActionType.LeadCreated,
          recordedBy: base.adminUserId,
          recorderType: Role.Admin,
          academyId: base.academy.id,
          createdAt: NOW.subtract(30, "day").toDate(),
        },
      });
    } else if (s.status === StudentStatus.trial) {
      await db.history.create({
        data: {
          targetType: TargetType.Student,
          targetId: s.id,
          action: HistoryActionType.LeadCreated,
          recordedBy: base.adminUserId,
          recorderType: Role.Admin,
          academyId: base.academy.id,
          createdAt: NOW.subtract(15, "day").toDate(),
        },
      });
      await db.history.create({
        data: {
          targetType: TargetType.Student,
          targetId: s.id,
          action: HistoryActionType.LeadToTrial,
          changes: { oldStatus: StudentStatus.lead, newStatus: StudentStatus.trial },
          metadata: { conversionDate: NOW.subtract(10, "day").toISOString() },
          recordedBy: base.adminUserId,
          recorderType: Role.Admin,
          academyId: base.academy.id,
          createdAt: NOW.subtract(10, "day").toDate(),
        },
      });
    } else if (s.status === StudentStatus.subscribed && s.idx < 60) {
      await db.history.create({
        data: {
          targetType: TargetType.Student,
          targetId: s.id,
          action: HistoryActionType.LeadCreated,
          recordedBy: base.adminUserId,
          recorderType: Role.Admin,
          academyId: base.academy.id,
          createdAt: NOW.subtract(100, "day").toDate(),
        },
      });
      await db.history.create({
        data: {
          targetType: TargetType.Student,
          targetId: s.id,
          action: HistoryActionType.TrialToSubscription,
          changes: { oldStatus: StudentStatus.trial, newStatus: StudentStatus.subscribed },
          metadata: { conversionDate: NOW.subtract(80, "day").toISOString() },
          recordedBy: base.adminUserId,
          recorderType: Role.Admin,
          academyId: base.academy.id,
          createdAt: NOW.subtract(80, "day").toDate(),
        },
      });
    }
  }

  for (const t of tutors) {
    for (let i = 0; i < 3; i++) {
      const dayOfWeek = (t.id + i) % 7;
      await db.tutorAvailability.create({
        data: {
          tutorId: t.id,
          dayOfWeek,
          startTime: NOW.hour(9 + i * 3).toDate(),
          endTime: NOW.hour(9 + i * 3 + 2).toDate(),
        },
      });
    }
  }
  for (const s of students.slice(0, 20)) {
    await db.studentAvailability.create({
      data: {
        studentId: s.id,
        dayOfWeek: s.idx % 7,
        startTime: NOW.hour(14).toDate(),
        endTime: NOW.hour(16).toDate(),
      },
    });
  }

  const assignable = await db.session.findMany({
    where: { academyId: base.academy.id, cancelledBy: null, startTime: { lt: NOW.toDate() } },
    select: { id: true },
    orderBy: { id: "asc" },
    take: 30,
  });
  const assignments = assignable.slice(0, 3);
  for (let i = 0; i < assignments.length; i++) {
    const assignment = await db.assignment.create({
      data: {
        sessionId: assignments[i].id,
        title: `واجب الحصة ${i + 1}`,
        description: faker.lorem.sentence(),
        deadline: NOW.add(3 + i, "day").toDate(),
        maxScore: 10,
        filePath: `seed/assignment-${i + 1}.pdf`,
        originalFileName: `assignment-${i + 1}.pdf`,
        fileSize: 4096,
        mimeType: "application/pdf",
      },
    });
    const participant = await db.sessionParticipant.findFirst({
      where: { sessionId: assignments[i].id },
      select: { id: true },
    });
    if (participant) {
      await db.homeworkSolution.create({
        data: {
          assignmentId: assignment.id,
          participantId: participant.id,
          filePath: `seed/solution-${i + 1}.pdf`,
          originalFileName: `solution-${i + 1}.pdf`,
          fileSize: 2048,
          mimeType: "application/pdf",
          score: 8 - i,
          feedback: "أحسنت",
          submittedAt: NOW.subtract(1, "day").toDate(),
          gradedAt: NOW.toDate(),
          gradedBy: base.adminUserId,
        },
      });
    }
  }
}

// ============================================================================
// Summary
// ============================================================================

async function printSummary(base: Awaited<ReturnType<typeof createBaseData>>) {
  const counts = await Promise.all([
    db.student.count({ where: { academyId: base.academy.id } }),
    db.tutor.count({ where: { academyId: base.academy.id } }),
    db.supervisor.count({ where: { academyId: base.academy.id } }),
    db.group.count({ where: { academyId: base.academy.id } }),
    db.session.count({ where: { academyId: base.academy.id } }),
    db.subscription.count({ where: { groupStudent: { group: { academyId: base.academy.id } } } }),
    db.revenue.count({ where: { academyId: base.academy.id } }),
    db.expense.count({ where: { academyId: base.academy.id } }),
    db.sessionParticipant.count({ where: { session: { academyId: base.academy.id } } }),
    db.sessionReport.count({ where: { participant: { session: { academyId: base.academy.id } } } }),
    db.chatRoom.count({ where: { academyId: base.academy.id } }),
    db.chatMessage.count({ where: { room: { academyId: base.academy.id } } }),
    db.tutorAttendance.count({ where: { session: { academyId: base.academy.id } } }),
  ]);
  const overdue = await db.subscription.count({
    where: {
      status: SubscriptionStatus.active,
      groupStudent: { group: { academyId: base.academy.id } },
      nextBillingDate: { lt: NOW.toDate() },
    },
  });
  const multiSubStudents = await db.$queryRaw<{ count: string }[]>`
    SELECT COUNT(*)::int as count FROM (
      SELECT gs."studentId" FROM "GroupStudent" gs
      JOIN "Subscription" s ON s."groupStudentId" = gs.id
      WHERE s."status" = 0
      GROUP BY gs."studentId"
      HAVING COUNT(*) >= 2
    ) t`;
  const mixedRateTutors = await db.$queryRaw<{ count: string }[]>`
    SELECT COUNT(*)::int as count FROM (
      SELECT s."tutorId" FROM "Session" s
      GROUP BY s."tutorId" HAVING COUNT(DISTINCT s."tutorRate") >= 2
    ) t`;

  console.log("\n==============================================");
  console.log("🎉 Demo academy seeded successfully!");
  console.log("==============================================");
  console.log(`Reference date : ${NOW.format("YYYY-MM-DD")}`);
  console.log(`Students       : ${counts[0]}`);
  console.log(`Tutors         : ${counts[1]}`);
  console.log(`Supervisors    : ${counts[2]}`);
  console.log(`Groups         : ${counts[3]}`);
  console.log(`Sessions       : ${counts[4]}`);
  console.log(`Subscriptions  : ${counts[5]}`);
  console.log(`Revenues       : ${counts[6]}`);
  console.log(`Expenses       : ${counts[7]}`);
  console.log(`Participants   : ${counts[8]}`);
  console.log(`SessionReports : ${counts[9]}`);
  console.log(`ChatRooms      : ${counts[10]}`);
  console.log(`ChatMessages   : ${counts[11]}`);
  console.log(`TutorAttendance: ${counts[12]}`);
  console.log(`Overdue (active, billing < now) subscriptions: ${overdue}`);
  console.log(`Students with 2+ active subscriptions: ${Number(multiSubStudents[0]?.count ?? 0)}`);
  console.log(`Tutors with 2+ distinct session rates: ${Number(mixedRateTutors[0]?.count ?? 0)}`);
  console.log("==============================================");
}

// ============================================================================
// Main
// ============================================================================

async function seedDemoAcademy() {
  const password = await bcrypt.hash(PASSWORD_PLAIN, 10);
  console.log(`🌱 Seeding started... (reference: ${NOW.format("YYYY-MM-DD")})`);

  const base = await createBaseData();
  const plans = await createPlans(base);
  const tutors = await createTutors(base, password);
  const students = await createStudents(base, password);
  const groupRecords = await createGroups(base, tutors);
  const { memberships } = await assignMemberships(base, students, tutors, groupRecords);
  const ctx = await createSessions(base, tutors, memberships, groupRecords);
  await createSubscriptionsAndRevenues(base, plans, memberships, ctx, students);
  await createTutorPayments(base, tutors, ctx);
  await createExtras(base, students, tutors, memberships);
  await printSummary(base);
}

cleanup()
  .then(() => seedDemoAcademy())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
