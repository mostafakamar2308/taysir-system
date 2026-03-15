import db from "@/lib/prisma";
import { Role } from "@/types/user";
import { SessionStatus, AttendanceStatus } from "@/types/session";
import bcrypt from "bcrypt";

const ACADEMY_NAMES = ["Al-Noor Academy", "Iqra Institute", "Tajweed Center"];
const SPECIALITIES = [
  "Tajweed",
  "Memorization",
  "Qira’at",
  "Tafseer",
  "Arabic Language",
];
const PLANS = [
  { title: "Basic", sessionsPerWeek: 2, price: 100, billingPeriod: "monthly" },
  {
    title: "Standard",
    sessionsPerWeek: 3,
    price: 200,
    billingPeriod: "monthly",
  },
  {
    title: "Premium",
    sessionsPerWeek: 5,
    price: 300,
    billingPeriod: "monthly",
  },
];

// Payment status and method constants
const PaymentStatus = {
  PENDING: 0,
  PAID: 1,
  FAILED: 2,
  REFUNDED: 3,
};

const PaymentMethod = {
  CASH: 0,
  CARD: 1,
  BANK_TRANSFER: 2,
  ONLINE: 3,
};

// Helper
const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// Generate random date between start and end
function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// Add minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Random hex color
function randomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

interface RoleData {
  academyId?: number;
  pricePerSession?: number;
  specialities?: number[];
  phone?: string;
  currencyId?: number; // added for tutors
}

async function createUserWithRole(
  email: string,
  name: string,
  role: number,
  roleData: RoleData = {},
) {
  const PASSWORD_HASH = await bcrypt.hash("password123", 10);
  const phone =
    roleData.phone || (role === Role.Tutor ? "01018303125" : "+966501234567");

  const user = await db.user.create({
    data: {
      email,
      password: PASSWORD_HASH,
      name,
      role,
      phone,
      preferredLanguage: "ar",
    },
  });

  switch (role) {
    case Role.SuperAdmin:
      await db.superAdmin.create({ data: { userId: user.id } });
      break;
    case Role.Admin:
      await db.admin.create({
        data: {
          userId: user.id,
          academyId: roleData.academyId!,
        },
      });
      break;
    case Role.Supervisor:
      await db.supervisor.create({
        data: {
          userId: user.id,
          academyId: roleData.academyId!,
        },
      });
      break;
    case Role.Tutor:
      await db.tutor.create({
        data: {
          userId: user.id,
          academyId: roleData.academyId!,
          pricePerSession: roleData.pricePerSession || 20.0,
          active: true,
          currencyId: roleData.currencyId!, // required now
          specialities: {
            connect: roleData.specialities?.map((id) => ({ id })) || [],
          },
        },
      });
      break;
  }

  return user;
}

async function main() {
  console.log("🌱 Seeding started...");

  // Clean up existing data (order matters)
  await db.$transaction([
    db.attendance.deleteMany(),
    db.session.deleteMany(),
    db.recurringPattern.deleteMany(),
    db.studentAvailability.deleteMany(),
    db.tutorAvailability.deleteMany(),
    db.payment.deleteMany(),
    db.expense.deleteMany(),
    db.studentTopicProgress.deleteMany(),
    db.studentProgramEnrollment.deleteMany(),
    db.programTopic.deleteMany(),
    db.program.deleteMany(),
    db.report.deleteMany(),
    db.student.deleteMany(),
    db.tutor.deleteMany(),
    db.supervisor.deleteMany(),
    db.admin.deleteMany(),
    db.superAdmin.deleteMany(),
    db.user.deleteMany(),
    db.plan.deleteMany(),
    db.currency.deleteMany(), // added
    db.academy.deleteMany(),
    db.speciality.deleteMany(),
  ]);

  // Create Plans

  // Create Specialities
  const createdSpecialities = await Promise.all(
    SPECIALITIES.map((title) =>
      db.speciality.create({
        data: { title },
      }),
    ),
  );
  console.log(`✅ Created ${createdSpecialities.length} specialities`);

  // Create Super Admin
  await createUserWithRole(
    "superadmin@example.com",
    "Super Admin",
    Role.SuperAdmin,
  );
  console.log("✅ Created Super Admin");

  // Store tutor IDs, student IDs, and default currency per academy
  const academyTutors: Record<number, number[]> = {};
  const academyStudents: Record<number, number[]> = {};
  const academyDefaultCurrency: Record<number, number> = {}; // currencyId

  // Create Academies, Admins, Supervisors, Tutors, and Students
  for (let i = 0; i < ACADEMY_NAMES.length; i++) {
    const academyName = ACADEMY_NAMES[i];

    const academy = await db.academy.create({
      data: {
        name: academyName,
        maxTutors: 20,
        maxStudents: 100,
        primaryColor: randomColor(),
      },
    });

    console.log(`📚 Created academy: ${academy.name}`);
    const createdPlans = await Promise.all(
      PLANS.map((plan) =>
        db.plan.create({
          data: { ...plan, academyId: academy.id },
        }),
      ),
    );
    console.log(`✅ Created ${createdPlans.length} plans for ${academy.name}`);
    // Create currencies for this academy
    const currencies = [
      {
        code: "SAR",
        name: "ريال سعودي",
        symbol: "ر.س",
        exchangeRate: 1.0,
        isDefault: true,
      },
      {
        code: "USD",
        name: "دولار أمريكي",
        symbol: "$",
        exchangeRate: 0.27,
        isDefault: false,
      },
      {
        code: "EGP",
        name: "جنيه مصري",
        symbol: "ج.م",
        exchangeRate: 5.0,
        isDefault: false,
      },
    ];
    const createdCurrencies = await Promise.all(
      currencies.map((c) =>
        db.currency.create({
          data: {
            ...c,
            academyId: academy.id,
          },
        }),
      ),
    );
    const defaultCurrency = createdCurrencies.find((c) => c.isDefault)!;
    academyDefaultCurrency[academy.id] = defaultCurrency.id;
    console.log(
      `  💱 Created ${createdCurrencies.length} currencies for ${academy.name}`,
    );

    academyTutors[academy.id] = [];
    academyStudents[academy.id] = [];

    // Admin
    await createUserWithRole(
      `admin${i + 1}@example.com`,
      `Admin ${i + 1}`,
      Role.Admin,
      { academyId: academy.id },
    );

    // Supervisors (2)
    for (let s = 1; s <= 2; s++) {
      await createUserWithRole(
        `supervisor${i + 1}_${s}@example.com`,
        `Supervisor ${i + 1}-${s}`,
        Role.Supervisor,
        { academyId: academy.id },
      );
    }
    console.log(`  👥 Created 2 supervisors for ${academy.name}`);

    // Tutors (10)
    const tutorIds: number[] = [];
    for (let t = 1; t <= 10; t++) {
      const tutorUser = await createUserWithRole(
        `tutor${i + 1}_${t}@example.com`,
        `Tutor ${i + 1}-${t}`,
        Role.Tutor,
        {
          academyId: academy.id,
          pricePerSession: 15 + (t % 10) * 2,
          specialities: [
            createdSpecialities[
              Math.floor(Math.random() * createdSpecialities.length)
            ].id,
            createdSpecialities[
              Math.floor(Math.random() * createdSpecialities.length)
            ].id,
          ].filter((v, idx, arr) => arr.indexOf(v) === idx), // unique
          currencyId: defaultCurrency.id,
        },
      );

      const tutorRecord = await db.tutor.findUnique({
        where: { userId: tutorUser.id },
      });
      tutorIds.push(tutorRecord!.id);
    }
    academyTutors[academy.id] = tutorIds;
    console.log(`  👨‍🏫 Created 10 tutors for ${academy.name}`);

    // Students (30) – assign random tutor from this academy
    for (let st = 1; st <= 30; st++) {
      const tutorId = randomElement(tutorIds);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
      const renewalDate = new Date(startDate);
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      const student = await db.student.create({
        data: {
          name: `Student ${i + 1}-${st}`,
          email: `student${i + 1}_${st}@example.com`,
          phone: `+1234567${String(st).padStart(3, "0")}`,
          country: randomElement([
            "Egypt",
            "Saudi Arabia",
            "UAE",
            "Jordan",
            "Morocco",
          ]),
          timezone: randomElement(["GMT+2", "GMT+3", "GMT+4"]),
          status: Math.floor(Math.random() * 3), // 0 trial, 1 subscribed, 2 lead
          startDate,
          renewalDate,
          tutorId,
          academyId: academy.id,
          planId: randomElement(createdPlans).id,
          currencyId: defaultCurrency.id, // required now
        },
      });
      academyStudents[academy.id].push(student.id);
    }
    console.log(`  🧑‍🎓 Created 30 students for ${academy.name}`);
  }

  // ─── Create Sessions for Active Students (status = 1) ─────────────────
  console.log("\n📅 Creating sessions for active students...");

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  const threeMonthsLater = new Date(now);
  threeMonthsLater.setMonth(now.getMonth() + 3);

  for (const academyId of Object.keys(academyStudents).map(Number)) {
    const studentIds = academyStudents[academyId];

    const activeStudents = await db.student.findMany({
      where: {
        id: { in: studentIds },
        status: 1,
      },
      include: { tutor: true },
    });

    for (const student of activeStudents) {
      const tutorId = student.tutorId;
      if (!tutorId) continue;

      const numSessions = 8 + Math.floor(Math.random() * 5); // 8-12

      for (let s = 0; s < numSessions; s++) {
        const startTime = randomDate(threeMonthsAgo, threeMonthsLater);
        const duration = randomElement([30, 45, 60]);
        const endTime = addMinutes(startTime, duration);

        let status: SessionStatus;
        let attendanceData: {
          status: AttendanceStatus;
          reason?: string;
        } | null = null;

        if (startTime < now) {
          const rand = Math.random();
          if (rand < 0.7) {
            status = SessionStatus.COMPLETED;
            const attRand = Math.random();
            if (attRand < 0.6) {
              attendanceData = { status: AttendanceStatus.ATTENDED };
            } else if (attRand < 0.8) {
              attendanceData = {
                status: AttendanceStatus.ABSENT_EXCUSED,
                reason: "مرض",
              };
            } else if (attRand < 0.95) {
              attendanceData = { status: AttendanceStatus.LATE };
            } else {
              attendanceData = {
                status: AttendanceStatus.ABSENT_UNEXCUSED,
                reason: "بدون عذر",
              };
            }
          } else if (rand < 0.9) {
            status = SessionStatus.CANCELLED;
            attendanceData = { status: AttendanceStatus.CANCELLED };
          } else {
            status = SessionStatus.RESCHEDULED;
          }
        } else {
          status =
            Math.random() < 0.9
              ? SessionStatus.SCHEDULED
              : SessionStatus.RESCHEDULED;
        }

        const session = await db.session.create({
          data: {
            startTime,
            endTime,
            durationMinutes: duration,
            status,
            topic: randomElement([
              "مراجعة سورة البقرة",
              "أحكام التجويد",
              "حفظ جزء 30",
              "تفسير الآيات",
              "تصحيح التلاوة",
              null,
            ]),
            notes: Math.random() < 0.3 ? "ملاحظة: أداء جيد" : null,
            studentId: student.id,
            tutorId,
            academyId,
          },
        });

        if (attendanceData) {
          await db.attendance.create({
            data: {
              sessionId: session.id,
              status: attendanceData.status,
              reason: attendanceData.reason,
            },
          });
        }
      }
    }
    console.log(
      `  ✅ Created sessions for ${activeStudents.length} active students in academy ${academyId}`,
    );
  }

  // ─── Create Payments (Revenues) ─────────────────
  console.log("\n💰 Creating payments for students...");

  for (const academyId of Object.keys(academyStudents).map(Number)) {
    const students = await db.student.findMany({
      where: { academyId },
      include: { plan: true },
    });
    const defaultCurrencyId = academyDefaultCurrency[academyId];

    for (const student of students) {
      const numPayments = Math.floor(Math.random() * 6); // 0-5
      const planPrice = student.plan?.price || 100;

      for (let p = 0; p < numPayments; p++) {
        const paymentDate = randomDate(
          new Date(now.getFullYear(), now.getMonth() - 6, 1),
          now,
        );
        const statusRand = Math.random();
        let status = PaymentStatus.PAID;
        if (statusRand > 0.8) status = PaymentStatus.PENDING;
        else if (statusRand > 0.95) status = PaymentStatus.FAILED;

        const method = randomElement([
          PaymentMethod.CASH,
          PaymentMethod.CARD,
          PaymentMethod.BANK_TRANSFER,
          PaymentMethod.ONLINE,
          null,
        ]);

        await db.payment.create({
          data: {
            amount: planPrice,
            currencyId: defaultCurrencyId, // using academy's default
            status,
            method: method !== null ? method : null,
            date: paymentDate,
            dueDate: null,
            description: `اشتراك ${student.plan?.title || ""}`,
            studentId: student.id,
            planId: student.planId,
            recordedBy: null,
            invoiceUrl:
              Math.random() > 0.5
                ? `https://invoice.example.com/${student.id}-${p}`
                : null,
            channel: randomElement(["متجر", "يدوي", "واتساب", null]),
            notes: null,
          },
        });
      }
    }
    console.log(`  ✅ Created payments for students in academy ${academyId}`);
  }

  // ─── Create Expenses ─────────────────
  console.log("\n📝 Creating expenses for academies...");

  const costCenters = [
    "رواتب",
    "إيجار",
    "تسويق",
    "أدوات وبرمجيات",
    "صيانة",
    "متنوعة",
  ];
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();

  for (const academyId of Object.keys(academyTutors).map(Number)) {
    const tutors = await db.tutor.findMany({
      where: { academyId },
      include: { user: true },
    });
    const defaultCurrencyId = academyDefaultCurrency[academyId];

    for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
      const expenseMonth = new Date(nowYear, nowMonth - monthOffset, 15);
      const monthStr = `${expenseMonth.getFullYear()}-${String(expenseMonth.getMonth() + 1).padStart(2, "0")}`;

      await db.expense.create({
        data: {
          date: expenseMonth,
          description: "إيجار المكتب",
          costCenter: randomElement(costCenters),
          amount: 3000,
          currencyId: defaultCurrencyId,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paid: true,
          reference: `RENT-${monthStr}`,
          notes: null,
          tutorId: null,
          salaryMonth: null,
          academyId,
        },
      });

      await db.expense.create({
        data: {
          date: expenseMonth,
          description: "إعلانات فيسبوك",
          costCenter: "تسويق",
          amount: 800,
          currencyId: defaultCurrencyId,
          paymentMethod: PaymentMethod.ONLINE,
          paid: Math.random() > 0.3,
          reference: Math.random() > 0.5 ? `FB-${monthStr}` : null,
          notes: null,
          tutorId: null,
          salaryMonth: null,
          academyId,
        },
      });

      await db.expense.create({
        data: {
          date: expenseMonth,
          description: "اشتراك Zoom",
          costCenter: "أدوات وبرمجيات",
          amount: 400,
          currencyId: defaultCurrencyId,
          paymentMethod: PaymentMethod.CARD,
          paid: true,
          reference: null,
          notes: "اشتراك شهري",
          tutorId: null,
          salaryMonth: null,
          academyId,
        },
      });
    }

    for (const tutor of tutors) {
      for (let monthOffset = 1; monthOffset >= 0; monthOffset--) {
        const salaryMonth = new Date(nowYear, nowMonth - monthOffset, 28);
        const monthStr = `${salaryMonth.getFullYear()}-${String(salaryMonth.getMonth() + 1).padStart(2, "0")}`;
        const sessionsCount = 20 + Math.floor(Math.random() * 40);
        const salaryAmount = sessionsCount * tutor.pricePerSession;

        if (Math.random() > 0.2) {
          await db.expense.create({
            data: {
              date: salaryMonth,
              description: `راتب شهر ${monthStr}`,
              costCenter: "رواتب",
              amount: salaryAmount,
              currencyId: defaultCurrencyId,
              paymentMethod: PaymentMethod.BANK_TRANSFER,
              paid: Math.random() > 0.3,
              reference: `SAL-${tutor.id}-${monthStr}`,
              notes: null,
              tutorId: tutor.id,
              salaryMonth: monthStr,
              academyId,
            },
          });
        }
      }
    }
    console.log(`  ✅ Created expenses for academy ${academyId}`);
  }

  // ─── Create Programs and Enrollments ─────────────────
  console.log("\n📚 Creating programs and enrollments...");

  function generateTopicsForProgram(
    programName: string,
  ): { title: string; description: string; order: number }[] {
    const topicsMap: Record<string, { title: string; description: string }[]> =
      {
        "حفظ القرآن الكريم - المستوى الأول": [
          { title: "سورة الناس", description: "حفظ سورة الناس مع التجويد" },
          { title: "سورة الفلق", description: "حفظ سورة الفلق مع التجويد" },
          { title: "سورة الإخلاص", description: "حفظ سورة الإخلاص والتفسير" },
          { title: "سورة المسد", description: "حفظ سورة المسد" },
          { title: "سورة النصر", description: "حفظ سورة النصر" },
          { title: "سورة الكافرون", description: "حفظ سورة الكافرون" },
          { title: "سورة الكوثر", description: "حفظ سورة الكوثر" },
          { title: "مراجعة شاملة", description: "مراجعة جميع السور المحفوظة" },
        ],
        "أحكام التجويد": [
          {
            title: "أحكام النون الساكنة والتنوين",
            description: "الإظهار، الإدغام، الإقلاب، الإخفاء",
          },
          {
            title: "أحكام الميم الساكنة",
            description: "الإخفاء الشفوي، الإدغام الشفوي، الإظهار الشفوي",
          },
          { title: "المدود", description: "المد الطبيعي والفرعي وأقسامه" },
          { title: "أحكام اللام", description: "لام التعريف ولام الفعل" },
          {
            title: "التفخيم والترقيق",
            description: "حروف التفخيم والترقيق وأحكامها",
          },
        ],
        "القراءات العشر": [
          { title: "قراءة نافع", description: "رواية ورش وقالون عن نافع" },
          { title: "قراءة ابن كثير", description: "رواية البزي وقنبل" },
          { title: "قراءة أبو عمرو", description: "رواية الدوري والسوسي" },
        ],
      };
    const topics = topicsMap[programName] || [
      { title: "موضوع عام", description: "" },
    ];
    return topics.map((t, idx) => ({ ...t, order: idx + 1 }));
  }

  const programTemplates = [
    {
      name: "حفظ القرآن الكريم - المستوى الأول",
      description: "برنامج حفظ جزء عم",
      level: "مبتدئ",
      duration: 12,
    },
    {
      name: "أحكام التجويد",
      description: "أحكام التجويد النظرية والتطبيقية",
      level: "متوسط",
      duration: 8,
    },
    {
      name: "القراءات العشر",
      description: "دراسة القراءات العشر",
      level: "متقدم",
      duration: 24,
    },
  ];

  for (const academyId of Object.keys(academyStudents).map(Number)) {
    const createdPrograms: number[] = [];

    for (const tmpl of programTemplates) {
      const topicsData = generateTopicsForProgram(tmpl.name);
      const program = await db.program.create({
        data: {
          name: tmpl.name,
          description: tmpl.description,
          level: tmpl.level,
          duration: tmpl.duration,
          academyId,
          topics: {
            create: topicsData,
          },
        },
        include: { topics: true },
      });
      createdPrograms.push(program.id);
    }

    const students = await db.student.findMany({ where: { academyId } });

    for (const student of students) {
      if (Math.random() > 0.5) continue;

      const programId = randomElement(createdPrograms);
      const program = await db.program.findUnique({
        where: { id: programId },
        include: { topics: true },
      });
      if (!program) continue;

      const statusRand = Math.random();
      const status = statusRand < 0.6 ? 0 : statusRand < 0.8 ? 1 : 2;
      const enrolledAt = randomDate(new Date(2025, 0, 1), new Date());
      const completedAt =
        status === 1 ? randomDate(enrolledAt, new Date()) : null;

      const enrollment = await db.studentProgramEnrollment.create({
        data: {
          studentId: student.id,
          programId,
          enrolledAt,
          completedAt,
          status,
        },
      });

      for (const topic of program.topics) {
        const completed = status === 1 ? true : Math.random() > 0.3;
        const completedAtTopic = completed
          ? randomDate(enrolledAt, new Date())
          : null;
        await db.studentTopicProgress.create({
          data: {
            enrollmentId: enrollment.id,
            topicId: topic.id,
            completed,
            completedAt: completedAtTopic,
            notes: completed ? "تم بنجاح" : null,
            sessionId: null,
          },
        });
      }
    }
  }
  console.log("  ✅ Created programs and enrollments");

  console.log("🌱 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
