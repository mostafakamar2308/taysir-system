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

// Helper to create a session with participants, attendance, and reports
async function createSessionWithParticipants(
  studentIds: number[],
  tutorId: number,
  academyId: number,
  startTime: dayjs.Dayjs,
  durationMinutes: number,
  isTrial: boolean,
  topic?: string,
) {
  // Create the session
  const session = await db.session.create({
    data: {
      startTime: startTime.toDate(),
      endTime: startTime.add(durationMinutes, "minute").toDate(),
      durationMinutes,
      topic: topic || faker.lorem.words(3),
      isTrial,
      tutorId,
      academyId,
    },
  });

  // Create participants and optionally their attendance + report
  for (const studentId of studentIds) {
    const participant = await db.sessionParticipant.create({
      data: {
        sessionId: session.id,
        studentId,
        balanceDeducted: !isTrial,
      },
    });

    // If session is in the past, add student attendance & maybe report
    if (startTime.isBefore(NOW)) {
      const attended = Math.random() < 0.9; // 90% attendance
      await db.sessionParticipant.update({
        where: { id: participant.id },
        data: {
          studentAttendanceStatus: attended
            ? AttendanceStatus.ATTENDED
            : AttendanceStatus.ABSENT_UNEXCUSED,
        },
      });

      if (attended && Math.random() < 0.8) {
        await db.sessionReport.create({
          data: {
            participantId: participant.id,
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

  return session;
}

// Original generateSessions now uses the above for single student (private)
async function generateSessions(
  studentId: number,
  tutorId: number,
  academyId: number,
  plan: { sessionsPerWeek: number },
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  isTrial = false,
) {
  const daysOfWeek = pickRandom([0, 1, 2, 3, 4, 5, 6], plan.sessionsPerWeek);
  let current = start.startOf("day");
  const sessions = [];

  while (current.isBefore(end) || current.isSame(end, "day")) {
    if (daysOfWeek.includes(current.day())) {
      const sessionDate = current.hour(16).minute(0).second(0);
      if (sessionDate.isAfter(start) && sessionDate.isBefore(end, "day")) {
        const session = await createSessionWithParticipants(
          [studentId],
          tutorId,
          academyId,
          sessionDate,
          60,
          isTrial,
        );
        sessions.push(session);
      }
    }
    current = current.add(1, "day");
  }
  return sessions;
}

// Generate a single group session with random subscribed students
async function generateGroupSession(
  academyId: number,
  monthStart: dayjs.Dayjs,
  monthEnd: dayjs.Dayjs,
  tutors: number[],
  subscribedStudents: { id: number }[],
) {
  if (subscribedStudents.length < 2) return;

  const studentCount = randomInt(2, Math.min(4, subscribedStudents.length));
  const groupStudents = pickRandom(subscribedStudents, studentCount).map(
    (s) => s.id,
  );
  const tutorId = tutors[randomInt(0, tutors.length - 1)];
  const sessionDay = randomInt(1, monthEnd.date());
  const sessionDate = monthStart.date(sessionDay).hour(14).minute(0).second(0); // different time
  const topic = faker.lorem.words(3) + " (مجموعة)";

  await createSessionWithParticipants(
    groupStudents,
    tutorId,
    academyId,
    sessionDate,
    90,
    false,
    topic,
  );
}

async function seedDemoAcademy() {
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

  // Create tutors with both rates
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
        privatePricePerHour: privateRate,
        groupPricePerHour: groupRate,
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
  const initialTutors = tutorRecords.slice(0, TUTORS_INITIAL).map((t) => t.id);
  const allTutors = tutorRecords.map((t) => t.id);
  console.log(`✅ ${tutorRecords.length} tutors`);

  // Month-by-month simulation
  const monthLeads: { id: number }[][] = [];
  const monthTrials: { id: number }[][] = [];
  const monthSubscribed: { id: number }[][] = [];

  for (let m = 0; m < MONTHS; m++) {
    const monthStart = START_DATE.add(m, "month");
    const monthEnd = monthStart.endOf("month");
    const isFirstMonth = m === 0;
    console.log(`\n--- Month ${m + 1}: ${monthStart.format("YYYY-MM")} ---`);

    // Renew existing subscriptions (unchanged logic, but sessions created later)
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

        await db.subscription.update({
          where: { id: lastSub.id },
          data: {
            endDate: monthStart.subtract(1, "day").toDate(),
            status: SubscriptionStatus.expired,
          },
        });

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
              increment: (student.plan?.sessionsPerWeek ?? 0) * 4,
            },
          },
        });

        // Payment
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

        // Generate sessions for this student
        const tutorId =
          allTutors[
            randomInt(0, (m < 2 ? initialTutors.length : allTutors.length) - 1)
          ];
        await generateSessions(
          student.id,
          tutorId,
          academy.id,
          plan!,
          monthStart,
          monthEnd,
        );
      }
      console.log(`  Renewed ${subscribedStudents.length} subscriptions`);
    }

    // Leads
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
    monthLeads[m] = leads;
    console.log(`  Created ${leadCount} leads`);

    // Trials
    const trialCount = TRIALS_BASE[m];
    const trialsToCreate = pickRandom(leads, trialCount);
    const trials = [];
    for (const lead of trialsToCreate) {
      const trialDate = dayjs(
        (await db.student.findUnique({ where: { id: lead.id } }))!.createdAt,
      ).add(randomInt(1, 5), "day");
      const finalTrialDate = trialDate.isBefore(monthEnd)
        ? trialDate
        : monthEnd;
      const tutorPool = m < 2 ? initialTutors : allTutors;
      const tutorId = tutorPool[randomInt(0, tutorPool.length - 1)];

      await db.student.update({
        where: { id: lead.id },
        data: {
          status: StudentStatus.trial,
          updatedAt: finalTrialDate.toDate(),
          tutorId,
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

      // Create trial session (single)
      const trialSessionDate = finalTrialDate.add(1, "day").hour(16);
      await createSessionWithParticipants(
        [lead.id],
        tutorId,
        academy.id,
        trialSessionDate,
        60,
        true,
        "جلسة تجريبية",
      );
      trials.push({ id: lead.id });
    }
    monthTrials[m] = trials;
    console.log(`  Converted ${trialCount} leads to trial`);

    // Conversions
    const convCount = CONVERSIONS_BASE[m];
    const conversionsToCreate = pickRandom(trials, convCount);
    const subscribedThisMonth = [];
    for (const trial of conversionsToCreate) {
      const plan = plans[randomInt(0, plans.length - 1)];
      const conversionDate = dayjs(
        (await db.student.findUnique({ where: { id: trial.id } }))!.updatedAt,
      ).add(randomInt(1, 4), "day");
      const finalConvDate = conversionDate.isBefore(monthEnd)
        ? conversionDate
        : monthEnd;

      await db.student.update({
        where: { id: trial.id },
        data: {
          status: StudentStatus.subscribed,
          tutorId: pickRandom(tutorRecords, 1)[0].id,
          planId: plan.id,
          updatedAt: finalConvDate.toDate(),
        },
      });
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

      const tutorPool = m < 2 ? initialTutors : allTutors;
      const tutorId = tutorPool[randomInt(0, tutorPool.length - 1)];
      await generateSessions(
        trial.id,
        tutorId,
        academy.id,
        plan,
        finalConvDate,
        monthEnd,
      );

      subscribedThisMonth.push({ id: trial.id });
    }
    monthSubscribed[m] = subscribedThisMonth;
    console.log(`  Converted ${convCount} trials to subscribed`);

    // Generate some group sessions this month (using subscribed students from this month)
    if (Math.random() < GROUP_SESSION_PROBABILITY) {
      const subscribedStudents = await db.student.findMany({
        where: {
          academyId: academy.id,
          status: StudentStatus.subscribed,
          id: { in: subscribedThisMonth.map((s) => s.id) },
        },
        select: { id: true },
      });
      if (subscribedStudents.length >= 2) {
        const groupCount = randomInt(1, MAX_GROUP_SESSIONS_PER_MONTH);
        for (let g = 0; g < groupCount; g++) {
          await generateGroupSession(
            academy.id,
            monthStart,
            monthEnd,
            allTutors,
            subscribedStudents,
          );
        }
        console.log(`  Generated ${groupCount} group sessions`);
      }
    }

    // Tutor payments for the month: compute private and group minutes separately
    const monthSessions = await db.session.findMany({
      where: {
        academyId: academy.id,
        startTime: { gte: monthStart.toDate(), lte: monthEnd.toDate() },
      },
      include: { participants: true, tutor: true },
    });

    // Calculate per tutor
    const tutorStats: Record<number, { privateMin: number; groupMin: number }> =
      {};
    for (const s of monthSessions) {
      const tid = s.tutorId;
      if (!tutorStats[tid]) tutorStats[tid] = { privateMin: 0, groupMin: 0 };
      const count = s.participants.length;
      if (count <= 1) {
        tutorStats[tid].privateMin += s.durationMinutes;
      } else {
        tutorStats[tid].groupMin += s.durationMinutes;
      }
    }

    for (const [tutorId, stats] of Object.entries(tutorStats)) {
      const tutor = await db.tutor.findUnique({
        where: { id: Number(tutorId) },
      });
      if (!tutor) continue;
      const expectedSalary =
        (stats.privateMin / 60) * tutor.privatePricePerHour +
        (stats.groupMin / 60) * tutor.groupPricePerHour;
      await db.expense.create({
        data: {
          date: monthEnd.toDate(),
          description: `راتب شهر ${monthStart.format("M")} (خاص: ${stats.privateMin}د، مجموعة: ${stats.groupMin}د)`,
          costCenterId: costCenters[0].id,
          amount: expectedSalary,
          currencyId: eurCurrency.id,
          method: PaymentMethod.BANK_TRANSFER,
          status: PaymentStatus.PAID,
          tutorId: Number(tutorId),
          salaryMonth: monthStart.format("YYYY-MM"),
          academyId: academy.id,
          recordedBy: adminUser.id,
        },
      });
    }
    console.log(`  Paid salaries for ${Object.keys(tutorStats).length} tutors`);

    // Notes, chat rooms (unchanged)
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

    // Chat rooms (unchanged)
    const studentsWithTutor = await db.student.findMany({
      where: {
        academyId: academy.id,
        tutorId: { not: null },
        status: { in: [StudentStatus.trial, StudentStatus.subscribed] },
      },
      select: { id: true, tutor: { select: { userId: true } }, userId: true },
    });
    for (const s of studentsWithTutor) {
      await db.chatRoom.upsert({
        where: {
          tutorUserId_studentUserId: {
            tutorUserId: s.tutor!.userId,
            studentUserId: s.userId,
          },
        },
        update: {},
        create: {
          tutorUserId: s.tutor!.userId,
          studentUserId: s.userId,
          academyId: academy.id,
        },
      });
    }
  }

  // Generate messages for all rooms (unchanged, omitted for brevity)
  const allRooms = await db.chatRoom.findMany({
    where: { academyId: academy.id },
  });
  for (const room of allRooms) {
    const participantIds: [number, number] = [
      room.tutorUserId,
      room.studentUserId,
    ];
    const startDate = room.createdAt;
    const messages = [];
    for (let i = 0; i < 100; i++) {
      const senderId = participantIds[i % 2];
      const createdAt = faker.date.between({ from: startDate, to: new Date() });
      messages.push({
        roomId: room.id,
        senderId,
        content: faker.lorem.sentence(),
        createdAt,
        updatedAt: createdAt,
      });
    }
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    await db.chatMessage.createMany({ data: messages });
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
