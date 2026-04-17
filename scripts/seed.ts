import db from "@/lib/prisma";
import bcrypt from "bcrypt";
import dayjs from "@/lib/dayjs";
import { Role } from "@/types/user";
import { HistoryActionType, TargetType } from "@/types/history";
import { StudentStatus } from "@/types/student";
import { AttendanceStatus } from "@/types/session";
import { SubscriptionStatus } from "@/types/subscription";
import { PaymentMethod, PaymentStatus } from "@/types/payment";

const ACADEMY_NAME = "أكاديمية التيسير النموذجية";
const SPECIALITIES = [
  "Tajweed",
  "Memorization",
  "Qira’at",
  "Tafseer",
  "Arabic Language",
];
const PLAN_TITLES = ["أساسي", "متوسط", "متقدم", "ممتاز"];
const PLAN_SESSIONS = [2, 3, 5, 7];
const PLAN_PRICES = [150, 300, 500, 800];
const PLAN_BILLING_PERIOD = 30;

const TUTOR_NAMES = [
  "الشيخ عبدالله",
  "الشيخ محمد",
  "الأستاذة نور",
  "الشيخ أحمد",
  "الدكتور عمر",
  "الأستاذة فاطمة",
  "الشيخ يوسف",
  "الأستاذة سارة",
  "الشيخ خالد",
  "الدكتورة ليلى",
];
const TUTOR_PRICES = [50, 60, 70];

// Countries for students
const COUNTRIES = [
  "Egypt",
  "Saudi Arabia",
  "UAE",
  "Jordan",
  "Morocco",
  "Yemen",
  "Oman",
];
const TIMEZONES = [
  "Africa/Cairo",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Aden",
  "Asia/Muscat",
];

// Helper functions
const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date): Date =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60000);

// ----------------------------------------------------------------------
// Main seed function
// ----------------------------------------------------------------------
async function main() {
  console.log("🌱 Seeding started...");

  // Clean up existing data in correct order
  await db.$transaction([
    db.attendance.deleteMany(),
    db.sessionReport.deleteMany(),
    db.session.deleteMany(),
    db.recurringPattern.deleteMany(),
    db.studentAvailability.deleteMany(),
    db.tutorAvailability.deleteMany(),
    db.revenue.deleteMany(),
    db.expense.deleteMany(),
    db.note.deleteMany(),
    db.history.deleteMany(),
    db.subscription.deleteMany(),
    db.student.deleteMany(),
    db.tutor.deleteMany(),
    db.supervisor.deleteMany(),
    db.admin.deleteMany(),
    db.plan.deleteMany(),
    db.academyCurrencyRate.deleteMany(),
    db.academy.deleteMany(),
    db.currency.deleteMany(),
    db.speciality.deleteMany(),
    db.user.deleteMany(),
    db.superAdmin.deleteMany(),
  ]);
  console.log("🌱 Cleanup Finished...");

  // 1. Create currencies
  const currencies = await Promise.all([
    db.currency.create({
      data: { code: "USD", name: "دولار أمريكي", symbol: "$" },
    }),
    db.currency.create({
      data: { code: "EGP", name: "جنيه مصري", symbol: "ج.م" },
    }),
    db.currency.create({
      data: { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
    }),
    db.currency.create({
      data: { code: "YER", name: "ريال يمني", symbol: "﷼" },
    }),
    db.currency.create({
      data: { code: "OMR", name: "ريال عماني", symbol: "﷼" },
    }),
  ]);
  const [usd, egp, sar, yer, omr] = currencies;
  console.log("✅ Created currencies");

  // 2. Create specialities
  const specialities = await Promise.all(
    SPECIALITIES.map((title) => db.speciality.create({ data: { title } })),
  );
  console.log("✅ Created specialities");

  // 3. Create super admin (optional, but needed for login)
  const superAdminUser = await db.user.create({
    data: {
      email: "mostafakamar.dev@gmail.com",
      password: await bcrypt.hash("24689110134", 10),
      name: "Super Admin",
      role: Role.SuperAdmin,
      phone: "+201018303125",
    },
  });
  await db.superAdmin.create({ data: { userId: superAdminUser.id } });
  console.log("✅ Created super admin");

  await db.saasPlan.createMany({
    data: [
      {
        name: "Free",
        dollarPrice: 0,
        egyptianPrice: 0,
        maxStudents: 30,
        maxTutors: 3,
        billingPeriod: 30,
      },
      {
        name: "Basic",
        dollarPrice: 46,
        egyptianPrice: 2500,
        maxStudents: 200,
        maxTutors: 20,
        billingPeriod: 30,
      },
      {
        name: "Professional",
        dollarPrice: 93,
        egyptianPrice: 5000,
        maxStudents: 500,
        maxTutors: 50,
        billingPeriod: 30,
      },
    ],
  });

  const saasPlan = await db.saasPlan.findFirst();

  const academy = await db.academy.create({
    data: {
      name: ACADEMY_NAME,
      maxTutors: 20,
      maxStudents: 500,
      primaryColor: "#1a9a5c",
      defaultCurrencyId: egp.id,
      saasPlanId: saasPlan!.id,
      saasPlanStartDate: dayjs().startOf("day").toDate(),
      saasPlanEndDate: dayjs().add(1, "month").startOf("day").toDate(),
    },
  });
  console.log(`✅ Created academy: ${academy.name}`);

  const admin = await db.user.create({
    data: {
      name: `أدمن ${ACADEMY_NAME}`,
      email: "admin@gmail.com",
      password: await bcrypt.hash("admin123", 10),
      role: Role.Admin,
      phone: `+9665${Math.floor(Math.random() * 10000000)}`,
      timezone: "Asia/Riyadh",
      admin: {
        create: {
          academyId: academy.id,
        },
      },
    },
  });
  console.log(`✅ Created admin: ${admin.name}`);

  // 5. Create currency rates (relative to EGP)
  const rates = [
    { currency: usd, rate: 48.0 },
    { currency: sar, rate: 10.0 },
    { currency: yer, rate: 0.15 },
    { currency: omr, rate: 125.0 },
  ];
  for (const r of rates) {
    await db.academyCurrencyRate.create({
      data: {
        academyId: academy.id,
        currencyId: r.currency.id,
        rate: r.rate,
      },
    });
  }
  console.log("✅ Created currency exchange rates");

  // 6. Create plans
  const plans = [];
  for (let i = 0; i < PLAN_TITLES.length; i++) {
    const plan = await db.plan.create({
      data: {
        title: PLAN_TITLES[i],
        sessionsPerWeek: PLAN_SESSIONS[i],
        price: PLAN_PRICES[i],
        billingPeriod: PLAN_BILLING_PERIOD,
        currencyId: egp.id,
        academyId: academy.id,
      },
    });
    plans.push(plan);
  }
  console.log(`✅ Created ${plans.length} plans`);

  // 7. Create tutors
  const tutors = [];
  for (let i = 0; i < TUTOR_NAMES.length; i++) {
    const tutorUser = await db.user.create({
      data: {
        email: `tutor${i + 1}@academiyati.com`,
        password: await bcrypt.hash("tutor123", 10),
        name: TUTOR_NAMES[i],
        role: Role.Tutor,
        phone: `+9665${Math.floor(Math.random() * 10000000)}`,
        timezone: "Asia/Riyadh",
      },
    });
    const tutor = await db.tutor.create({
      data: {
        userId: tutorUser.id,
        academyId: academy.id,
        pricePerSession: randomElement(TUTOR_PRICES),
        active: true,
        currencyId: egp.id,
        bio: "معلم معتمد في القرآن وعلومه",
        qualifications: "إجازة في القراءات العشر",
        zoomAuthenticated: true,
        specialities: {
          connect: [
            randomElement(specialities).id,
            randomElement(specialities).id,
          ]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((id) => ({ id })),
        },
      },
    });
    tutors.push(tutor);
  }
  console.log(`✅ Created ${tutors.length} tutors`);

  // Helper to create history records
  const addHistory = async (
    targetType: number,
    targetId: number,
    action: number,
    recordedBy: number,
    academyId: number,
    changes?: any,
    metadata?: any,
  ) => {
    await db.history.create({
      data: {
        targetType,
        targetId,
        action,
        changes: changes ? JSON.stringify(changes) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        recordedBy,
        recorderType: TargetType.Admin, // assume admin
        academyId,
      },
    });
  };

  // Helper to create a student with history
  const createStudentWithHistory = async (
    name: string,
    email: string,
    status: number,
    planId: number | null,
    tutorId: number | null,
    academyId: number,
    recordedBy: number,
    createdAt: Date,
    conversionDates?: { leadToTrial?: Date; trialToSub?: Date },
  ) => {
    const student = await db.student.create({
      data: {
        name,
        email,
        age: randomInt(8, 25),
        phone: randomElement([
          `+201018303125`,
          "+201206721705",
          "+201011214517",
        ]),
        country: randomElement(COUNTRIES),
        timezone: randomElement(TIMEZONES),
        status,
        currencyId: egp.id,
        source: randomElement(["facebook", "instagram", "referral", null]),
        currentProgram: randomElement(["Quran", "Tajweed", "Arabic"]),
        emergencyContactName: "Emergency Contact",
        emergencyContactPhone: "+123456789",
        preferredLanguage: "ar",
        tutorId,
        academyId,
        planId,
        createdAt,
      },
    });

    // Always create LeadCreated (even if status is not lead, we pretend they started as lead)
    await addHistory(
      TargetType.Student,
      student.id,
      HistoryActionType.LeadCreated,
      recordedBy,
      academyId,
      null,
      { conversionDate: createdAt.toISOString() },
    );

    if (status === StudentStatus.trial || status === StudentStatus.subscribed) {
      // Lead -> Trial
      const leadToTrialDate =
        conversionDates?.leadToTrial ||
        randomDate(createdAt, dayjs(createdAt).add(7, "day").toDate());
      await addHistory(
        TargetType.Student,
        student.id,
        HistoryActionType.LeadToTrial,
        recordedBy,
        academyId,
        { oldStatus: StudentStatus.lead, newStatus: StudentStatus.trial },
        { conversionDate: leadToTrialDate.toISOString() },
      );
    }

    if (status === StudentStatus.subscribed) {
      // Trial -> Subscription
      const trialToSubDate =
        conversionDates?.trialToSub ||
        randomDate(
          dayjs(createdAt).add(7, "day").toDate(),
          dayjs(createdAt).add(30, "day").toDate(),
        );
      await addHistory(
        TargetType.Student,
        student.id,
        HistoryActionType.TrialToSubscription,
        recordedBy,
        academyId,
        { oldStatus: StudentStatus.trial, newStatus: StudentStatus.subscribed },
        { conversionDate: trialToSubDate.toISOString() },
      );
    }

    return student;
  };

  const recordedBy = superAdminUser.id; // using super admin as recorder for now

  // 8. Create leads (100)
  const leadStudents = [];
  for (let i = 1; i <= 100; i++) {
    const name = `Lead Student ${i}`;
    const email = `lead${i}@example.com`;
    const student = await createStudentWithHistory(
      name,
      email,
      StudentStatus.lead,
      null,
      null,
      academy.id,
      recordedBy,
      randomDate(dayjs().subtract(6, "month").toDate(), dayjs().toDate()),
    );
    leadStudents.push(student);
  }
  console.log(`✅ Created ${leadStudents.length} lead students`);

  // 9. Create trials (50)
  const trialStudents = [];
  for (let i = 1; i <= 50; i++) {
    const name = `Trial Student ${i}`;
    const email = `trial${i}@example.com`;
    const createdAt = randomDate(
      dayjs().subtract(3, "month").toDate(),
      dayjs().toDate(),
    );
    const leadToTrialDate = randomDate(
      createdAt,
      dayjs(createdAt).add(7, "day").toDate(),
    );
    const student = await createStudentWithHistory(
      name,
      email,
      StudentStatus.trial,
      null,
      randomElement(tutors).id,
      academy.id,
      recordedBy,
      createdAt,
      { leadToTrial: leadToTrialDate },
    );
    trialStudents.push(student);
  }
  console.log(`✅ Created ${trialStudents.length} trial students`);

  // For each trial, create a trial session (past)
  for (const student of trialStudents) {
    const tutorId = student.tutorId!;
    const sessionDate = randomDate(
      dayjs().subtract(30, "day").toDate(),
      dayjs().toDate(),
    );
    const startTime = dayjs(sessionDate)
      .hour(randomInt(9, 20))
      .minute(0)
      .second(0)
      .toDate();
    const endTime = addMinutes(startTime, 60);
    const session = await db.session.create({
      data: {
        startTime,
        endTime,
        durationMinutes: 60,
        topic: "حصة تجريبية",
        notes: "حصة تعريفية للطالب",
        isTrial: true,
        studentId: student.id,
        tutorId,
        academyId: academy.id,
      },
    });
    // Add attendance (random)
    const attendanceStatus = randomElement([
      AttendanceStatus.ATTENDED,
      AttendanceStatus.LATE,
      AttendanceStatus.ABSENT_EXCUSED,
    ]);
    await db.attendance.create({
      data: {
        sessionId: session.id,
        tutorAttendanceStatus: AttendanceStatus.ATTENDED,
        studentAttendanceStatus: attendanceStatus,
        reason:
          attendanceStatus === AttendanceStatus.ABSENT_EXCUSED ? "مرض" : null,
      },
    });
    // Add report
    await db.sessionReport.create({
      data: {
        sessionId: session.id,
        rating: randomInt(3, 5),
        outcomes: "تم التعرف على مستوى الطالب",
        strengths: "مستوى جيد في التلاوة",
        weaknesses: "يحتاج تحسين في أحكام التجويد",
        nextGoals: "مراجعة أحكام النون الساكنة",
        comments: "طالب مجتهد",
      },
    });
  }
  console.log(
    `✅ Created trial sessions for ${trialStudents.length} trial students`,
  );

  // 10. Create subscribed students (250)
  const subscribedStudents = [];
  const now = dayjs.utc();
  const sixMonthsAgo = now.subtract(6, "month");
  for (let i = 1; i <= 250; i++) {
    const name = `Subscribed Student ${i}`;
    const email = `sub${i}@example.com`;
    const createdAt = randomDate(sixMonthsAgo.toDate(), now.toDate());
    const leadToTrialDate = randomDate(
      createdAt,
      dayjs(createdAt).add(7, "day").toDate(),
    );
    const trialToSubDate = randomDate(
      leadToTrialDate,
      dayjs(leadToTrialDate).add(30, "day").toDate(),
    );
    const plan = randomElement(plans);
    const tutor = randomElement(tutors);
    const student = await createStudentWithHistory(
      name,
      email,
      StudentStatus.subscribed,
      plan.id,
      tutor.id,
      academy.id,
      recordedBy,
      createdAt,
      { leadToTrial: leadToTrialDate, trialToSub: trialToSubDate },
    );
    subscribedStudents.push(student);
  }
  console.log(`✅ Created ${subscribedStudents.length} subscribed students`);

  // 11. Create subscriptions and payments for subscribed students
  for (const student of subscribedStudents) {
    const plan = plans.find((p) => p.id === student.planId)!;
    const startDate = randomDate(
      dayjs().subtract(6, "month").toDate(),
      dayjs().toDate(),
    );
    const subscription = await db.subscription.create({
      data: {
        studentId: student.id,
        planId: plan.id,
        startDate,
        endDate: null, // ongoing
        status: SubscriptionStatus.active,
      },
    });
    // Update student's currentSubscriptionId
    await db.student.update({
      where: { id: student.id },
      data: { currentSubscriptionId: subscription.id },
    });

    // Generate monthly payments since startDate until now
    let paymentDate = dayjs(startDate);
    const endDate = dayjs();
    while (
      paymentDate.isBefore(endDate) ||
      paymentDate.isSame(endDate, "month")
    ) {
      const dueDate = paymentDate.add(plan.billingPeriod, "day").toDate();
      await db.revenue.create({
        data: {
          amount: plan.price,
          currencyId: egp.id,
          status: PaymentStatus.PAID,
          method: randomElement([
            PaymentMethod.CARD,
            PaymentMethod.BANK_TRANSFER,
            PaymentMethod.ONLINE,
          ]),
          date: paymentDate.toDate(),
          dueDate,
          description: `اشتراك ${plan.title}`,
          channel: "online",
          studentId: student.id,
          planId: plan.id,
          academyId: academy.id,
          subscriptionId: subscription.id,
        },
      });
      paymentDate = paymentDate.add(1, "month");
    }
  }
  console.log(`✅ Created subscriptions and payments for subscribed students`);

  // 12. Create sessions for the past 2 months and next week for subscribed students
  const twoMonthsAgo = now.subtract(2, "month");
  const nextWeekStart = now.add(1, "day").startOf("week");
  const nextWeekEnd = nextWeekStart.add(6, "day");

  const dayMapping: Record<number, number> = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
  }; // for deterministic days
  // For simplicity, we'll distribute sessions evenly across week: e.g., if sessionsPerWeek = 3, we'll pick Monday, Wednesday, Friday (indices 1,3,5)
  const getSessionDays = (sessionsPerWeek: number): number[] => {
    const indices = [1, 3, 5]; // Mon, Wed, Fri
    return indices.slice(0, sessionsPerWeek);
  };

  for (const student of subscribedStudents) {
    const plan = plans.find((p) => p.id === student.planId)!;
    const tutorId = student.tutorId!;
    const sessionsPerWeek = plan.sessionsPerWeek;
    const sessionDays = getSessionDays(sessionsPerWeek);
    const startHour = randomInt(9, 20);
    const duration = 60;

    // Past sessions (2 months)
    let currentWeek = twoMonthsAgo.startOf("week");
    while (
      currentWeek.isBefore(now) &&
      currentWeek.isBefore(twoMonthsAgo.add(2, "month"))
    ) {
      for (const dayIndex of sessionDays) {
        const sessionDate = currentWeek.add(dayIndex, "day");
        if (sessionDate.isBefore(now)) {
          const startTime = sessionDate
            .hour(startHour)
            .minute(0)
            .second(0)
            .toDate();
          const endTime = addMinutes(startTime, duration);
          // Create session
          const session = await db.session.create({
            data: {
              startTime,
              endTime,
              durationMinutes: duration,
              topic: randomElement([
                "مراجعة السور",
                "أحكام التجويد",
                "حفظ جديد",
                "تفسير",
              ]),
              notes: Math.random() > 0.7 ? "أداء جيد" : null,
              studentId: student.id,
              tutorId,
              academyId: academy.id,
            },
          });
          // Attendance
          const attRand = Math.random();
          let studentAttendance = AttendanceStatus.ATTENDED;
          const tutorAttendance = AttendanceStatus.ATTENDED;
          let reason = null;
          if (attRand < 0.7) {
            studentAttendance = AttendanceStatus.ATTENDED;
          } else if (attRand < 0.8) {
            studentAttendance = AttendanceStatus.LATE;
            reason = "تأخر 5 دقائق";
          } else if (attRand < 0.9) {
            studentAttendance = AttendanceStatus.ABSENT_EXCUSED;
            reason = "مرض";
          } else {
            studentAttendance = AttendanceStatus.ABSENT_UNEXCUSED;
          }
          // Tutor always attends (simplify)
          await db.attendance.create({
            data: {
              sessionId: session.id,
              tutorAttendanceStatus: tutorAttendance,
              studentAttendanceStatus: studentAttendance,
              reason,
            },
          });
          // Report
          await db.sessionReport.create({
            data: {
              sessionId: session.id,
              rating: randomInt(3, 5),
              outcomes: "تم إنجاز المطلوب",
              strengths: "تحسن في التلاوة",
              weaknesses: "يحتاج مراجعة",
              nextGoals: "مراجعة المادة القادمة",
              comments: "مستمر",
            },
          });
        }
      }
      currentWeek = currentWeek.add(1, "week");
    }

    // Future sessions (next week)
    currentWeek = nextWeekStart.clone();
    for (const dayIndex of sessionDays) {
      const sessionDate = currentWeek.add(dayIndex, "day");
      if (
        sessionDate.isBefore(nextWeekEnd) ||
        sessionDate.isSame(nextWeekEnd, "day")
      ) {
        const startTime = sessionDate
          .hour(startHour)
          .minute(0)
          .second(0)
          .toDate();
        const endTime = addMinutes(startTime, duration);
        await db.session.create({
          data: {
            startTime,
            endTime,
            durationMinutes: duration,
            topic: null,
            notes: null,
            studentId: student.id,
            tutorId,
            academyId: academy.id,
          },
        });
      }
    }
  }
  console.log(`✅ Created past and future sessions for subscribed students`);

  // 13. Create expenses for last 2 months
  const expenseCategories = [
    {
      description: "إيجار المكتب",
      costCenter: "إيجار",
      amount: 5000,
      method: PaymentMethod.BANK_TRANSFER,
    },
    {
      description: "إعلانات فيسبوك",
      costCenter: "تسويق",
      amount: 1500,
      method: PaymentMethod.ONLINE,
    },
    {
      description: "اشتراك Zoom",
      costCenter: "أدوات وبرمجيات",
      amount: 400,
      method: PaymentMethod.CARD,
    },
  ];
  for (let monthOffset = 1; monthOffset <= 2; monthOffset++) {
    const expenseMonth = now.subtract(monthOffset, "month");
    const monthStr = expenseMonth.format("YYYY-MM");
    // Fixed expenses
    for (const cat of expenseCategories) {
      await db.expense.create({
        data: {
          date: expenseMonth.date(15).toDate(),
          description: cat.description,
          costCenter: cat.costCenter,
          amount: cat.amount,
          currencyId: egp.id,
          method: cat.method,
          status: PaymentStatus.PAID,
          academyId: academy.id,
        },
      });
    }
    // Tutor salaries
    for (const tutor of tutors) {
      // Count sessions taught by this tutor in this month
      const sessionsCount = await db.session.count({
        where: {
          tutorId: tutor.id,
          startTime: {
            gte: expenseMonth.startOf("month").toDate(),
            lt: expenseMonth.endOf("month").toDate(),
          },
        },
      });
      if (sessionsCount > 0) {
        const salary = sessionsCount * tutor.pricePerSession;
        await db.expense.create({
          data: {
            date: expenseMonth.date(28).toDate(),
            description: `راتب شهر ${monthStr}`,
            costCenter: "رواتب",
            amount: salary,
            currencyId: egp.id,
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PAID,
            tutorId: tutor.id,
            salaryMonth: monthStr,
            academyId: academy.id,
          },
        });
      }
    }
  }
  console.log(`✅ Created expenses for last 2 months`);

  console.log("\n🌱 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
