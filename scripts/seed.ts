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

const NOW = dayjs();
const ACADEMY_NAME = "أكاديمية النمو";
const START_DATE = dayjs().startOf("year");
const MONTHS = 6;

// Plans in EGP
const PLANS = [
  { title: "الخطة الأساسية", sessionsPerWeek: 2, price: 600 },
  { title: "الخطة المتوسطة", sessionsPerWeek: 3, price: 800 },
  { title: "الخطة المتقدمة", sessionsPerWeek: 4, price: 1200 },
];

const TUTORS_INITIAL = 10;
const TUTORS_ADDED_MONTH3 = 5;

const LEADS_BASE = [50, 65, 80, 95, 110, 130];
const TRIALS_BASE = [30, 40, 50, 60, 70, 80];
const CONVERSIONS_BASE = [10, 15, 20, 25, 30, 35];

// Group sessions: probability each month to have a few
const GROUP_SESSION_PROBABILITY = 0.6;
const MAX_GROUP_SESSIONS_PER_MONTH = 16;

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function cleanup() {
  console.log("🧹 Starting database cleanup...");

  await db.chatMessage.deleteMany();
  await db.chatRoom.deleteMany();
  await db.pushSubscription.deleteMany();
  await db.note.deleteMany();

  await db.sessionReport.deleteMany();
  console.log("  ✅ Session reports deleted");
  await db.sessionParticipant.deleteMany();
  console.log("  ✅ Session participants deleted");
  await db.session.deleteMany();
  console.log("  ✅ Sessions deleted");

  await db.revenue.deleteMany();
  await db.expense.deleteMany();
  await db.subscription.deleteMany();
  await db.plan.deleteMany();
  await db.student.deleteMany();
  await db.tutor.deleteMany();
  await db.supervisor.deleteMany();
  await db.admin.deleteMany();
  await db.superAdmin.deleteMany();
  await db.user.deleteMany();
  await db.currency.deleteMany();
  await db.history.deleteMany();
  await db.academy.deleteMany();

  console.log("🎉 Cleanup complete!");
}

const SPECIALITIES = [
  "Tajweed",
  "Memorization",
  "Qira’at",
  "Tafseer",
  "Arabic Language",
];

async function seed() {
  const password = await bcrypt.hash("24689110134", 10);
  console.log("🌱 Seeding started...");

  // Cost centers, currencies, specialities – unchanged
  const costCenters = await Promise.all([
    db.costCenter.create({ data: { title: "مرتبات المعلمين" } }),
    db.costCenter.create({ data: { title: "مرتبات الموظفين (غير المعلمين)" } }),
    db.costCenter.create({ data: { title: "الإعلانات" } }),
    db.costCenter.create({ data: { title: "تصوير المحتوى" } }),
    db.costCenter.create({ data: { title: "إشتراكات برامج" } }),
    db.costCenter.create({ data: { title: "ضرائب" } }),
    db.costCenter.create({ data: { title: "حوافز" } }),
    db.costCenter.create({ data: { title: "أخرى" } }),
  ]);

  await Promise.all([
    db.currency.create({
      data: { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
    }),
    db.currency.create({
      data: { code: "USD", name: "دولار أمريكي", symbol: "$" },
    }),
    db.currency.create({
      data: { code: "EGP", name: "جنيه مصري", symbol: "ج.م" },
    }),
  ]);
  console.log("✅ Currencies created");

  await Promise.all([
    db.saasPlan.create({
      data: {
        billingPeriod: 30,
        dollarPrice: 15,
        egyptianPrice: 30,
        maxStudents: 200,
        maxTutors: 200,
        name: "الخطة الأولي",
      },
    }),
    db.saasPlan.create({
      data: {
        billingPeriod: 30,
        dollarPrice: 15,
        egyptianPrice: 30,
        maxStudents: 200,
        maxTutors: 200,
        name: "الخطة الثانية",
      },
    }),
    db.saasPlan.create({
      data: {
        billingPeriod: 30,
        dollarPrice: 15,
        egyptianPrice: 30,
        maxStudents: 200,
        maxTutors: 200,
        name: "الخطة الثالثة",
      },
    }),
  ]);
  console.log("✅ Saas Plan created");

  await Promise.all(
    SPECIALITIES.map((title) => db.speciality.create({ data: { title } })),
  );
  console.log("✅ Specialities created");

  // Super admin
  const superAdminUser = await db.user.create({
    data: {
      email: "mostafakamar.dev@gmail.com",
      password: await bcrypt.hash("24689110134", 10),
      name: "Super Admin: Mostaf Kamar",
      role: Role.SuperAdmin,
      phone: "+201018303125",
    },
  });
  await db.superAdmin.create({ data: { userId: superAdminUser.id } });
  console.log("✅ Super admin created");

  const eurCurrency = await db.currency.findUnique({ where: { code: "EGP" } });
  if (!eurCurrency) throw new Error("EGP currency not found");
  const specialities = await db.speciality.findMany();

  // Academy
  const academy = await db.academy.create({
    data: {
      name: ACADEMY_NAME,
      id: 1,
      maxTutors: 20,
      maxStudents: 200,
      primaryColor: "#2E86AB",
      defaultCurrencyId: eurCurrency.id,
    },
  });
  console.log(`✅ Academy: ${academy.name}`);

  // Plans
  const plans = await Promise.all(
    PLANS.map((p) =>
      db.plan.create({
        data: {
          ...p,
          billingPeriod: 30,
          currencyId: eurCurrency.id,
          academyId: academy.id,
        },
      }),
    ),
  );

  // Admin
  const adminUser = await db.user.create({
    data: {
      email: "demo.admin@academy.com",
      password,
      name: "أحمد مدير الأكاديمية",
      role: Role.Admin,
      phone: "+201018303125",
    },
  });
  await db.admin.create({
    data: { userId: adminUser.id, academyId: academy.id },
  });

  const tutorRecords = [];
  for (let i = 0; i < TUTORS_INITIAL + TUTORS_ADDED_MONTH3; i++) {
    const user = await db.user.create({
      data: {
        email: `tutor.demo${i + 1}@academy.com`,
        password,
        name: faker.person.fullName(),
        role: Role.Tutor,
        phone: `+201018303125`,
      },
    });
    const privateRate = randomInt(60, 80);
    const groupRate = randomInt(40, 55);
    const tutor = await db.tutor.create({
      data: {
        userId: user.id,
        academyId: academy.id,
        currencyId: eurCurrency.id,
        baseHourlyRate: privateRate,
        baseGroupHourlyRate: groupRate,
        active: true,
        bio: faker.lorem.sentence(),
        qualifications: faker.lorem.words(3),
        specialities: {
          connect: pickRandom(specialities, randomInt(1, 3)).map((s) => ({
            id: s.id,
          })),
        },
      },
    });
    tutorRecords.push({ ...tutor, userId: user.id });
  }

  console.log(`✅ ${tutorRecords.length} tutors`);
  for (let m = 0; m < MONTHS; m++) {
    const monthStart = START_DATE.add(m, "month");
    const monthEnd = monthStart.endOf("month");

    const leadCount = LEADS_BASE[m];
    const leads = [];
    for (let i = 0; i < leadCount; i++) {
      const creationDay = randomInt(1, monthEnd.date());
      const createdAt = monthStart
        .date(creationDay)
        .hour(10)
        .minute(0)
        .second(0);
      const studentUser = await db.user.create({
        data: {
          email: `lead${m}${i}@demo.com`,
          password,
          name: faker.person.fullName(),
          role: Role.Student,
          phone: `+201018303125`,
        },
      });
      const student = await db.student.create({
        data: {
          status: StudentStatus.lead,
          currencyId: eurCurrency.id,
          academyId: academy.id,
          createdAt: createdAt.toDate(),
          userId: studentUser.id,
        },
      });
      await db.history.create({
        data: {
          targetType: TargetType.Student,
          targetId: student.id,
          action: HistoryActionType.LeadCreated,
          recordedBy: adminUser.id,
          recorderType: Role.Admin,
          academyId: academy.id,
          createdAt: createdAt.toDate(),
        },
      });
      leads.push({ id: student.id });
    }
    console.log(`  Created ${leadCount} leads`);

    // Trials
    const trialCount = TRIALS_BASE[m];
    const trialsToCreate = pickRandom(leads, trialCount);
    for (const lead of trialsToCreate) {
      const trialDate = dayjs(
        (await db.student.findUnique({ where: { id: lead.id } }))!.createdAt,
      ).add(randomInt(1, 5), "day");
      const finalTrialDate = trialDate.isBefore(monthEnd)
        ? trialDate
        : monthEnd;

      await db.student.update({
        where: { id: lead.id },
        data: {
          status: StudentStatus.trial,
          updatedAt: finalTrialDate.toDate(),
        },
      });
      await db.history.create({
        data: {
          targetType: TargetType.Student,
          targetId: lead.id,
          action: HistoryActionType.LeadToTrial,
          changes: {
            oldStatus: StudentStatus.lead,
            newStatus: StudentStatus.trial,
          },
          metadata: { conversionDate: finalTrialDate.toISOString() },
          recordedBy: adminUser.id,
          recorderType: Role.Admin,
          academyId: academy.id,
          createdAt: finalTrialDate.toDate(),
        },
      });

      // Conversions
      const convCount = CONVERSIONS_BASE[m];

      console.log(`  Converted ${convCount} trials to subscribed`);
    }
  }
}
cleanup()
  .then(() => seed())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
