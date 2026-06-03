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
const MONTHS = 5;

// Plans in EGP
const PLANS = [
  { title: "الخطة الأساسية", sessionsPerWeek: 2, price: 600 },
  { title: "الخطة المتوسطة", sessionsPerWeek: 3, price: 800 },
  { title: "الخطة المتقدمة", sessionsPerWeek: 4, price: 1200 },
];

const TUTORS_INITIAL = 10;
const TUTORS_ADDED_MONTH3 = 2;

const LEADS_BASE = [50, 65, 80, 95, 110];
const TRIALS_BASE = [30, 40, 50, 60, 70];
const CONVERSIONS_BASE = [10, 15, 20, 25, 30];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function cleanup() {
  console.log("🧹 Starting database cleanup...");

  // 1. Delete chat messages (no FK to other seeded entities that we'll keep)
  await db.chatMessage.deleteMany();
  console.log("  ✅ Chat messages deleted");

  // 2. Delete chat rooms
  await db.chatRoom.deleteMany();
  console.log("  ✅ Chat rooms deleted");

  // 3. Delete push subscriptions
  await db.pushSubscription.deleteMany();
  console.log("  ✅ Push subscriptions deleted");

  // 4. Delete notes
  await db.note.deleteMany();
  console.log("  ✅ Notes deleted");

  // 5. Delete session reports (FK to sessions)
  await db.sessionReport.deleteMany();
  console.log("  ✅ Session reports deleted");

  // 6. Delete attendance
  await db.attendance.deleteMany();
  console.log("  ✅ Attendance records deleted");

  // 7. Delete sessions
  await db.session.deleteMany();
  console.log("  ✅ Sessions deleted");

  // 8. Delete revenues (FK to students, plans, subscriptions)
  await db.revenue.deleteMany();
  console.log("  ✅ Revenues deleted");

  // 9. Delete expenses (FK to tutors, cost centers)
  await db.expense.deleteMany();
  console.log("  ✅ Expenses deleted");

  // 10. Delete subscriptions
  await db.subscription.deleteMany();
  console.log("  ✅ Subscriptions deleted");

  // 11. Delete plans (we'll recreate them in seed)
  await db.plan.deleteMany();
  console.log("  ✅ Plans deleted");

  // 12. Delete students (FK to users)
  await db.student.deleteMany();
  console.log("  ✅ Students deleted");

  // 13. Delete tutors
  await db.tutor.deleteMany();
  console.log("  ✅ Tutors deleted");

  // 14. Delete supervisors
  await db.supervisor.deleteMany();
  console.log("  ✅ Supervisors deleted");

  // 15. Delete admin
  await db.admin.deleteMany();
  console.log("  ✅ Admins deleted");

  // 16. Delete superAdmin
  await db.superAdmin.deleteMany();
  console.log("  ✅ Super admins deleted");

  // 17. Delete users (except maybe the super admin? We'll delete all)
  // Be careful: if you want to keep the super admin, skip this.
  await db.user.deleteMany();
  console.log("  ✅ Users deleted");

  await db.currency.deleteMany();
  console.log("  ✅ Currencies deleted");

  // 18. Delete academy (optional – remove if you have multiple academies)
  await db.academy.deleteMany();
  console.log("  ✅ Academy deleted");

  // 19. Keep currencies, specialities, cost centers (they are reference data)
  console.log(
    "💾 Skipping deletion of reference data: currencies, specialities, cost centers.",
  );

  console.log("🎉 Cleanup complete!");
}

async function generateSessions(
  studentId: number,
  tutorId: number,
  academyId: number,
  plan: { sessionsPerWeek: number },
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  isTrial = false,
) {
  // Pick random distinct weekdays for the sessions
  const daysOfWeek = pickRandom([0, 1, 2, 3, 4, 5, 6], plan.sessionsPerWeek);

  // Generate all occurrences in the interval [start, end]
  let current = start.startOf("day");
  const sessions = [];

  while (current.isBefore(end) || current.isSame(end, "day")) {
    if (daysOfWeek.includes(current.day())) {
      const sessionDate = current.hour(16).minute(0).second(0);
      if (sessionDate.isAfter(start) && sessionDate.isBefore(end, "day")) {
        const session = await db.session.create({
          data: {
            startTime: sessionDate.toDate(),
            endTime: sessionDate.add(60, "minute").toDate(),
            durationMinutes: 60,
            topic: faker.lorem.words(3),
            isTrial,
            studentId,
            tutorId,
            academyId,
          },
        });
        sessions.push(session);
      }
    }
    current = current.add(1, "day");
  }
  return sessions;
}

const SPECIALITIES = [
  "Tajweed",
  "Memorization",
  "Qira’at",
  "Tafseer",
  "Arabic Language",
];

// ========= Main seed function ==========
async function seedDemoAcademy() {
  const password = await bcrypt.hash("24689110134", 10);

  console.log("🌱 Seeding started...");

  const costCenters = await Promise.all([
    db.costCenter.create({
      data: { title: "مرتبات المعلمين" },
    }),
    db.costCenter.create({
      data: { title: "مرتبات الموظفين (غير المعلمين)" },
    }),
    db.costCenter.create({
      data: { title: "الإعلانات" },
    }),
    db.costCenter.create({
      data: { title: "تصوير المحتوى" },
    }),
    db.costCenter.create({
      data: { title: "إشتراكات برامج" },
    }),
    db.costCenter.create({
      data: { title: "ضرائب" },
    }),
    db.costCenter.create({
      data: { title: "حوافز" },
    }),
    db.costCenter.create({
      data: { title: "أخرى" },
    }),
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
  console.log("✅ Created currencies");

  await Promise.all(
    SPECIALITIES.map((title) => db.speciality.create({ data: { title } })),
  );
  console.log("✅ Created specialities");

  // Create super admin
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
  console.log("✅ Created super admin");

  console.log("🌱 Seeding demo academy...");

  // 1. Fetch currencies, specialities, super admin, etc.
  const eurCurrency = await db.currency.findUnique({ where: { code: "EGP" } });
  if (!eurCurrency)
    throw new Error("EGP currency not found; run the initial seed first.");

  const specialities = await db.speciality.findMany();
  if (specialities.length === 0)
    throw new Error("No specialities; run initial seed first.");

  // 2. Create the demo academy
  const academy = await db.academy.create({
    data: {
      name: ACADEMY_NAME,
      maxTutors: 20,
      maxStudents: 200,
      primaryColor: "#2E86AB",
      defaultCurrencyId: eurCurrency.id,
    },
  });
  console.log(`✅ Academy created: ${academy.name}`);

  // 3. Create the 3 EGP plans
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
  console.log("✅ Plans created");

  // 4. Create admin user & admin for this academy
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
  console.log("✅ Admin created");

  // 5. Create tutor users & tutors (12 total)
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
    const tutor = await db.tutor.create({
      data: {
        userId: user.id,
        academyId: academy.id,
        currencyId: eurCurrency.id,
        pricePerHour: randomInt(60, 80),
        active: true,
        bio: faker.lorem.sentence(),
        qualifications: faker.lorem.words(3),
        specialities: {
          connect: pickRandom(specialities, randomInt(1, 3)).map((s) => ({
            id: s?.id,
          })),
        },
      },
    });
    tutorRecords.push({ ...tutor, userId: user.id });
  }
  const initialTutors = tutorRecords.slice(0, TUTORS_INITIAL).map((t) => t.id);
  const allTutors = tutorRecords.map((t) => t.id);
  console.log(
    `✅ Created ${tutorRecords.length} tutors (${TUTORS_INITIAL} initial, 2 added later)`,
  );

  // 6. Track students per phase
  interface StudentEntry {
    id: number;
    status: StudentStatus;
    planId?: number;
    subscriptionId?: number;
    conversionDate?: dayjs.Dayjs;
  }
  const monthLeads: StudentEntry[][] = [[], [], [], []];
  const monthTrials: StudentEntry[][] = [[], [], [], []];
  const monthSubscribed: StudentEntry[][] = [[], [], [], []];

  // 7. Month-by-month simulation
  for (let m = 0; m < MONTHS; m++) {
    const monthStart = START_DATE.add(m, "month");
    const monthEnd = monthStart.endOf("month");
    const isFirstMonth = m === 0;

    console.log(`\n--- Month ${m + 1}: ${monthStart.format("YYYY-MM")} ---`);

    // ---- 7.1 Renew existing subscriptions (not month 1) ----
    if (!isFirstMonth) {
      const subscribedStudents = await db.student.findMany({
        where: { academyId: academy.id, status: StudentStatus.subscribed },
        include: {
          subscriptions: { orderBy: { startDate: "desc" }, take: 1 },
          plan: true,
        },
      });

      for (const student of subscribedStudents) {
        const lastSub = student.subscriptions[0];
        if (!lastSub) continue;

        // Revoke previous subscription
        await db.subscription.update({
          where: { id: lastSub.id },
          data: {
            endDate: monthStart.subtract(1, "day").toDate(),
            status: SubscriptionStatus.expired,
          },
        });

        // Create new full-month subscription
        const newSub = await db.subscription.create({
          data: {
            studentId: student.id,
            planId: lastSub.planId,
            startDate: monthStart.toDate(),
            endDate: monthEnd.toDate(),
            academyId: academy.id,
            status: SubscriptionStatus.active,
          },
        });

        await db.student.update({
          where: { id: student.id },
          data: {
            sessionsBalance: {
              increment: student.plan?.sessionsPerWeek
                ? student.plan.sessionsPerWeek * 4
                : 0,
            },
          },
        });

        // Create monthly payment
        const plan = plans.find((p) => p.id === lastSub.planId);
        await db.revenue.create({
          data: {
            amount: plan!.price,
            currencyId: eurCurrency.id,
            status: PaymentStatus.PAID,
            method: pickRandom(
              [
                PaymentMethod.CASH,
                PaymentMethod.CARD,
                PaymentMethod.BANK_TRANSFER,
                PaymentMethod.ONLINE,
              ],
              1,
            )[0],
            dueDate: monthStart.toDate(),
            description: `اشتراك شهر ${monthStart.format("M")} - ${plan!.title}`,
            academyId: academy.id,
            studentId: student.id,
            planId: plan!.id,
            recordedBy: adminUser.id,
            subscriptionId: newSub.id,
          },
        });

        // Generate weekly sessions for this month (all relevant tutors)
        const tutorId =
          allTutors[
            randomInt(0, (m < 2 ? initialTutors.length : allTutors.length) - 1)
          ];
        const sessions = await generateSessions(
          student.id,
          tutorId,
          academy.id,
          plan!,
          monthStart,
          monthEnd,
        );

        // Add attendance & reports for past sessions
        for (const session of sessions) {
          if (dayjs(session.startTime).isBefore(NOW)) {
            if (Math.random() < 0.9) {
              await db.attendance.create({
                data: {
                  sessionId: session.id,
                  tutorAttendanceStatus: AttendanceStatus.ATTENDED,
                  studentAttendanceStatus: AttendanceStatus.ATTENDED,
                },
              });
              if (Math.random() < 0.8) {
                await db.sessionReport.create({
                  data: {
                    sessionId: session.id,
                    rating: randomInt(2, 5),
                    outcomes: faker.lorem.sentence(),
                    strengths: faker.lorem.sentence(),
                    weaknesses:
                      Math.random() > 0.5 ? faker.lorem.sentence() : undefined,
                    nextGoals: faker.lorem.sentence(),
                    comments: faker.lorem.paragraph(),
                  },
                });
              }
            }
          }
        }
      }
      console.log(`  Renewed ${subscribedStudents.length} subscriptions`);
    }

    // ---- 7.2 Generate new leads ----
    const leadCount = LEADS_BASE[m];
    const leads: StudentEntry[] = [];
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

      // History: LeadCreated
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
      leads.push({ id: student.id, status: StudentStatus.lead });
    }
    monthLeads[m] = leads;
    console.log(`  Created ${leadCount} leads`);

    // ---- 7.3 Convert some leads to trials ----
    const trialCount = TRIALS_BASE[m];
    const trialsToCreate = pickRandom(leads, trialCount);
    const trials: StudentEntry[] = [];
    for (const lead of trialsToCreate) {
      // a few days after lead creation
      const trialDate = dayjs(
        (await db.student.findUnique({ where: { id: lead.id } }))!.createdAt,
      ).add(randomInt(1, 5), "day");
      // keep within month
      const finalTrialDate = trialDate.isBefore(monthEnd)
        ? trialDate
        : monthEnd;
      const tutorPool = m < 2 ? initialTutors : allTutors;
      const tutorId = tutorPool[randomInt(0, tutorPool.length - 1)];
      // Update status
      await db.student.update({
        where: { id: lead.id },
        data: {
          status: StudentStatus.trial,
          updatedAt: finalTrialDate.toDate(),
          tutorId,
        },
      });

      // History: LeadToTrial
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

      // Create trial session (isTrial = true)

      const trialSessionDate = finalTrialDate.add(1, "day").hour(16);
      const trialSession = await db.session.create({
        data: {
          startTime: trialSessionDate.toDate(),
          endTime: trialSessionDate.add(60, "minute").toDate(),
          durationMinutes: 60,
          topic: "جلسة تجريبية",
          isTrial: true,
          studentId: lead.id,
          tutorId,
          academyId: academy.id,
        },
      });

      // If session is in the past, add attendance and possibly report
      if (trialSessionDate.isBefore(NOW)) {
        if (Math.random() < 0.9) {
          await db.attendance.create({
            data: {
              sessionId: trialSession.id,
              tutorAttendanceStatus: AttendanceStatus.ATTENDED,
              studentAttendanceStatus: AttendanceStatus.ATTENDED,
            },
          });
          if (Math.random() < 0.8) {
            await db.sessionReport.create({
              data: {
                sessionId: trialSession.id,
                rating: randomInt(3, 5),
                outcomes: faker.lorem.sentence(),
                strengths: faker.lorem.sentence(),
                weaknesses: faker.lorem.sentence(),
                nextGoals: faker.lorem.sentence(),
                comments: faker.lorem.paragraph(),
              },
            });
          }
        }
      }

      trials.push({
        id: lead.id,
        status: StudentStatus.trial,
        planId: undefined,
      });
    }
    monthTrials[m] = trials;
    console.log(`  Converted ${trialCount} leads to trial`);

    // ---- 7.4 Convert some trials to paid subscriptions ----
    const convCount = CONVERSIONS_BASE[m];
    const conversionsToCreate = pickRandom(trials, convCount);
    const subscribedThisMonth: StudentEntry[] = [];
    for (const trial of conversionsToCreate) {
      // choose a random plan
      const plan = plans[randomInt(0, plans.length - 1)];
      const conversionDate = dayjs(
        (await db.student.findUnique({ where: { id: trial.id } }))!.updatedAt,
      ).add(randomInt(1, 4), "day"); // after trial
      const finalConvDate = conversionDate.isBefore(monthEnd)
        ? conversionDate
        : monthEnd;

      // Update status to subscribed
      await db.student.update({
        where: { id: trial.id },
        data: {
          status: StudentStatus.subscribed,
          tutorId: pickRandom(tutorRecords, 1)[0].id,
          planId: plan.id,
          updatedAt: finalConvDate.toDate(),
        },
      });

      // History: TrialToSubscription
      await db.history.create({
        data: {
          targetType: TargetType.Student,
          targetId: trial.id,
          action: HistoryActionType.TrialToSubscription,
          changes: {
            oldStatus: StudentStatus.trial,
            newStatus: StudentStatus.subscribed,
          },
          metadata: { conversionDate: finalConvDate.toISOString() },
          recordedBy: adminUser.id,
          recorderType: Role.Admin,
          academyId: academy.id,
          createdAt: finalConvDate.toDate(),
        },
      });

      // Create initial subscription (until end of month)
      const subscription = await db.subscription.create({
        data: {
          studentId: trial.id,
          planId: plan.id,
          startDate: finalConvDate.toDate(),
          endDate: monthEnd.toDate(),
          academyId: academy.id,
          status: SubscriptionStatus.active,
        },
      });

      // Create payment for the initial (prorated? full price for simplicity)
      await db.revenue.create({
        data: {
          amount: plan.price,
          currencyId: eurCurrency.id,
          status: PaymentStatus.PAID,
          method: pickRandom(
            [
              PaymentMethod.CASH,
              PaymentMethod.CARD,
              PaymentMethod.BANK_TRANSFER,
              PaymentMethod.ONLINE,
            ],
            1,
          )[0],
          dueDate: finalConvDate.toDate(),
          description: `اشتراك أولي - ${plan.title}`,
          academyId: academy.id,
          studentId: trial.id,
          planId: plan.id,
          recordedBy: adminUser.id,
          subscriptionId: subscription.id,
        },
      });

      // Generate weekly sessions from conversion date to end of month
      const tutorPool = m < 2 ? initialTutors : allTutors;
      const tutorId = tutorPool[randomInt(0, tutorPool.length - 1)];
      const sessions = await generateSessions(
        trial.id,
        tutorId,
        academy.id,
        plan,
        finalConvDate,
        monthEnd,
      );

      // Add attendance & reports for past sessions
      for (const session of sessions) {
        if (dayjs(session.startTime).isBefore(NOW)) {
          await db.attendance.create({
            data: {
              sessionId: session.id,
              tutorAttendanceStatus: AttendanceStatus.ATTENDED,
              studentAttendanceStatus: AttendanceStatus.ATTENDED,
            },
          });
          if (Math.random() < 0.8) {
            await db.sessionReport.create({
              data: {
                sessionId: session.id,
                rating: randomInt(2, 5),
                outcomes: faker.lorem.sentence(),
                strengths: faker.lorem.sentence(),
                weaknesses:
                  Math.random() > 0.5 ? faker.lorem.sentence() : undefined,
                nextGoals: faker.lorem.sentence(),
                comments: faker.lorem.paragraph(),
              },
            });
          }
        }
      }

      subscribedThisMonth.push({
        id: trial.id,
        status: StudentStatus.subscribed,
        planId: plan.id,
        subscriptionId: subscription.id,
        conversionDate: finalConvDate,
      });
    }
    monthSubscribed[m] = subscribedThisMonth;
    console.log(`  Converted ${convCount} trials to subscribed`);

    // ---- 7.5 Generate tutor payments for the month ----
    const monthSessions = await db.session.findMany({
      where: {
        academyId: academy.id,
        startTime: { gte: monthStart.toDate(), lte: monthEnd.toDate() },
        attendance: {
          tutorAttendanceStatus: {
            in: [AttendanceStatus.ATTENDED],
          },
        },
      },
      include: { tutor: true },
    });

    // Group by tutor
    const tutorSessionsMap: Record<number, number> = {};
    for (const s of monthSessions) {
      tutorSessionsMap[s.tutorId] = (tutorSessionsMap[s.tutorId] || 0) + 1;
    }

    for (const [tutorId, count] of Object.entries(tutorSessionsMap)) {
      const tutor = await db.tutor.findUnique({
        where: { id: Number(tutorId) },
      });
      if (!tutor) continue;
      await db.expense.create({
        data: {
          date: monthEnd.toDate(),
          description: `راتب شهر ${monthStart.format("M")}`,
          costCenterId: costCenters[0].id,
          amount: count * tutor.pricePerHour,
          currencyId: eurCurrency.id,
          method: PaymentMethod.BANK_TRANSFER,
          status: PaymentStatus.PAID,
          tutorId: tutor.id,
          salaryMonth: monthStart.format("YYYY-MM"),
          academyId: academy.id,
          recordedBy: adminUser.id,
        },
      });
    }
    console.log(
      `  Paid salaries for ${Object.keys(tutorSessionsMap).length} tutors`,
    );

    // ---- 7.6 Random notes for some students ----
    const allStudentsThisMonth = [...leads, ...trials, ...subscribedThisMonth];
    const noteStudents = pickRandom(
      allStudentsThisMonth,
      Math.min(5, allStudentsThisMonth.length),
    );
    for (const s of noteStudents) {
      await db.note.create({
        data: {
          content: faker.lorem.paragraph(),
          targetType: TargetType.Student,
          targetId: s.id,
          authorId: adminUser.id,
          studentId: s.id,
        },
      });
    }

    // ---- 8 Creating Chat Rooms with messages ----
    console.log("\n💬 Creating chat rooms and messages...");

    const studentsWithTutor = await db.student.findMany({
      where: {
        academyId: academy.id,
        tutorId: { not: null },
        status: { in: [StudentStatus.trial, StudentStatus.subscribed] },
      },
      select: { id: true, tutor: true, userId: true, createdAt: true },
    });

    for (const s of studentsWithTutor) {
      if (!s.tutor) continue;
      await db.chatRoom.upsert({
        where: {
          tutorUserId_studentUserId: {
            tutorUserId: s.tutor.userId,
            studentUserId: s.userId,
          },
        },
        update: {},
        create: {
          tutorUserId: s.tutor.userId,
          studentUserId: s.userId,
          academyId: academy.id,
        },
      });
    }
    console.log(`  ✅ ${studentsWithTutor.length} tutor–student chat rooms`);

    async function generateChatMessages(
      roomId: number,
      participantUserIds: [number, number], // [userA, userB]
      startDate: Date,
      countPerUser: number,
    ) {
      const messages: {
        roomId: number;
        senderId: number;
        content: string;
        createdAt: Date;
        updatedAt: Date;
      }[] = [];

      for (let i = 0; i < countPerUser * 2; i++) {
        const senderId = participantUserIds[i % 2];
        const createdAt = faker.date.between({
          from: startDate,
          to: dayjs().toDate(),
        });
        messages.push({
          roomId,
          senderId,
          content: faker.lorem.sentence(),
          createdAt,
          updatedAt: createdAt,
        });
      }

      // Sort chronologically
      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Batch insert
      await db.chatMessage.createMany({ data: messages });
    }

    const allRooms = await db.chatRoom.findMany({
      where: { academyId: academy.id },
    });

    for (const room of allRooms) {
      const participantIds: [number, number] | null = [
        room.tutorUserId,
        room.studentUserId,
      ];
      if (participantIds) {
        const startDate = room.createdAt;
        await generateChatMessages(room.id, participantIds, startDate, 50);
      }
    }
    console.log(`  ✅ Messages generated for all chat rooms`);
  }

  console.log("\n🎉 Demo academy seeded successfully!");
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
