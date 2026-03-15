import db from "@/lib/prisma";
import bcrypt from "bcrypt";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------
const ACADEMY_NAMES = ["Al-Noor Academy", "Iqra Institute", "Tajweed Center"];
const SPECIALITIES = [
  "Tajweed",
  "Memorization",
  "Qira’at",
  "Tafseer",
  "Arabic Language",
];
const COUNTRIES = ["Egypt", "Saudi Arabia", "UAE", "Jordan", "Morocco"];
const TIMEZONES = ["Africa/Cairo", "Asia/Riyadh", "Asia/Dubai"];
const COST_CENTERS = [
  "رواتب",
  "إيجار",
  "تسويق",
  "أدوات وبرمجيات",
  "صيانة",
  "متنوعة",
];

// Enums mapped to integers
const RoleMap = {
  SuperAdmin: 0,
  Admin: 1,
  Supervisor: 2,
  Tutor: 3,
};

const StudentStatusMap = {
  lead: 0,
  trial: 1,
  subscribed: 2,
  churned: 3,
  paused: 4,
};

const SessionStatusMap = {
  SCHEDULED: 0,
  COMPLETED: 1,
  CANCELLED: 2,
  RESCHEDULED: 3,
};

const AttendanceStatusMap = {
  ATTENDED: 0,
  ABSENT_EXCUSED: 1,
  ABSENT_UNEXCUSED: 2,
  LATE: 3,
  CANCELLED: 4,
};

const PaymentStatusMap = {
  PENDING: 0,
  PAID: 1,
  FAILED: 2,
  REFUNDED: 3,
};

const PaymentMethodMap = {
  CASH: 0,
  CARD: 1,
  BANK_TRANSFER: 2,
  ONLINE: 3,
};

// ----------------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------------
const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date): Date => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};
const randomColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
};

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
    db.student.deleteMany(),
    db.tutor.deleteMany(),
    db.supervisor.deleteMany(),
    db.admin.deleteMany(),
    db.plan.deleteMany(),
    db.academy.deleteMany(),
    db.currency.deleteMany(),
    db.speciality.deleteMany(),
    db.user.deleteMany(),
    db.superAdmin.deleteMany(),
  ]);

  // Create global currencies
  const currencies = await Promise.all([
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
  const [sar] = currencies;
  console.log("✅ Created currencies");

  // Create specialities
  const specialities = await Promise.all(
    SPECIALITIES.map((title) => db.speciality.create({ data: { title } })),
  );
  console.log("✅ Created specialities");

  // Create super admin
  const superAdminUser = await db.user.create({
    data: {
      email: "superadmin@example.com",
      password: await bcrypt.hash("password123", 10),
      name: "Super Admin",
      role: RoleMap.SuperAdmin,
      phone: "+966500000000",
    },
  });
  await db.superAdmin.create({ data: { userId: superAdminUser.id } });
  console.log("✅ Created super admin");

  // Store academy data for later use
  const academyIds: number[] = [];
  const academyTutors: Record<number, number[]> = {};
  const academyStudents: Record<number, number[]> = {};

  // For each academy
  for (let i = 0; i < ACADEMY_NAMES.length; i++) {
    const academyName = ACADEMY_NAMES[i];
    console.log(`\n📚 Creating ${academyName}...`);

    // Create academy with default currency (SAR for all)
    const academy = await db.academy.create({
      data: {
        name: academyName,
        maxTutors: 20,
        maxStudents: 200,
        primaryColor: randomColor(),
        defaultCurrencyId: sar.id,
      },
    });
    academyIds.push(academy.id);
    academyTutors[academy.id] = [];
    academyStudents[academy.id] = [];

    // Create 3 plans for this academy
    const plans = [];
    for (let p = 1; p <= 3; p++) {
      const plan = await db.plan.create({
        data: {
          title: `Plan ${p}`,
          sessionsPerWeek: p * 2,
          price: p * 150,
          billingPeriod: 30, // days
          currencyId: sar.id,
          academyId: academy.id,
        },
      });
      plans.push(plan);
    }
    console.log(`  ✅ Created 3 plans`);

    // Create admin user
    const adminUser = await db.user.create({
      data: {
        email: `admin${i + 1}@example.com`,
        password: await bcrypt.hash("password123", 10),
        name: `Admin ${i + 1}`,
        role: RoleMap.Admin,
        phone: `+96650123456${i}`,
      },
    });
    await db.admin.create({
      data: { userId: adminUser.id, academyId: academy.id },
    });
    console.log(`  ✅ Created admin`);

    // Create 2 supervisors
    for (let s = 1; s <= 2; s++) {
      const supUser = await db.user.create({
        data: {
          email: `supervisor${i + 1}_${s}@example.com`,
          password: await bcrypt.hash("password123", 10),
          name: `Supervisor ${i + 1}-${s}`,
          role: RoleMap.Supervisor,
          phone: `+96650234567${s}`,
        },
      });
      await db.supervisor.create({
        data: { userId: supUser.id, academyId: academy.id },
      });
    }
    console.log(`  ✅ Created 2 supervisors`);

    // Create 10 tutors
    const tutorIds: number[] = [];
    for (let t = 1; t <= 10; t++) {
      const tutorUser = await db.user.create({
        data: {
          email: `tutor${i + 1}_${t}@example.com`,
          password: await bcrypt.hash("password123", 10),
          name: `Tutor ${i + 1}-${t}`,
          role: RoleMap.Tutor,
          phone: `+96650345678${t}`,
        },
      });
      const tutor = await db.tutor.create({
        data: {
          userId: tutorUser.id,
          academyId: academy.id,
          pricePerSession: 15 + (t % 5) * 5, // 15-35
          active: true,
          currencyId: sar.id,
          bio: "Experienced Quran teacher",
          qualifications: "Ijazah in Hafs",
          imageUrl: null,
          zoomAuthenticated: Math.random() > 0.5,
          zoomUrl: Math.random() > 0.7 ? "https://zoom.us/j/123" : null,
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
      tutorIds.push(tutor.id);
    }
    academyTutors[academy.id] = tutorIds;
    console.log(`  ✅ Created 10 tutors`);

    // Create 200 students per academy
    const students: { id: number; status: number; tutorId: number | null }[] =
      [];
    for (let st = 1; st <= 200; st++) {
      // Determine status: first 100 leads, next 50 trials, last 50 mix
      let status: number;
      if (st <= 100) {
        status = StudentStatusMap.lead;
      } else if (st <= 150) {
        status = StudentStatusMap.trial;
      } else {
        // Among last 50: 30 subscribed, 10 churned, 10 paused
        const r = st - 150; // 1..50
        if (r <= 30) status = StudentStatusMap.subscribed;
        else if (r <= 40) status = StudentStatusMap.churned;
        else status = StudentStatusMap.paused;
      }

      const tutorId = randomElement(tutorIds);
      const startDate = dayjs
        .utc()
        .subtract(Math.floor(Math.random() * 180), "day")
        .toDate();
      const renewalDate = dayjs.utc(startDate).add(30, "day").toDate();

      const student = await db.student.create({
        data: {
          name: `Student ${i + 1}-${st}`,
          email: `student${i + 1}_${st}@example.com`,
          age: 8 + Math.floor(Math.random() * 15),
          phone: `+1234567${String(st).padStart(3, "0")}`,
          country: randomElement(COUNTRIES),
          timezone: randomElement(TIMEZONES),
          status: status,
          startDate,
          renewalDate,
          currencyId: sar.id,
          source: randomElement([
            "facebook",
            "snapchat",
            "instagram",
            "referral",
            null,
          ]),
          currentProgram: randomElement(["Quran", "Tajweed", "Arabic", null]),
          emergencyContactName: "Emergency Contact",
          emergencyContactPhone: "+123456789",
          preferredLanguage: "ar",
          imageUrl: null,
          tutorId: tutorId,
          academyId: academy.id,
          planId:
            status === StudentStatusMap.subscribed
              ? randomElement(plans).id
              : null,
        },
      });
      students.push({ id: student.id, status, tutorId });
      academyStudents[academy.id].push(student.id);
    }
    console.log(`  ✅ Created 200 students`);

    // For each student, create 50 past sessions and a recurring pattern for future sessions
    for (const student of students) {
      const tutorId = student.tutorId!;
      const studentId = student.id;

      // Past 50 sessions (random dates in last 6 months)
      const now = dayjs.utc();
      const sixMonthsAgo = now.subtract(6, "month");
      for (let s = 0; s < 50; s++) {
        const startTime = randomDate(sixMonthsAgo.toDate(), now.toDate());
        const duration = randomElement([30, 45, 60]);
        const endTime = dayjs.utc(startTime).add(duration, "minute").toDate();

        // Determine session status based on date
        let sessionStatus: number;
        let tutorAttendance: number | null = null;
        let studentAttendance: number | null = null;
        let attendanceReason: string | null = null;

        if (startTime < now.toDate()) {
          // Past session
          const rand = Math.random();
          if (rand < 0.7) {
            sessionStatus = SessionStatusMap.COMPLETED;
            // Attendance random
            const attRand = Math.random();
            if (attRand < 0.6) {
              tutorAttendance = AttendanceStatusMap.ATTENDED;
              studentAttendance = AttendanceStatusMap.ATTENDED;
            } else if (attRand < 0.75) {
              tutorAttendance = AttendanceStatusMap.ATTENDED;
              studentAttendance = AttendanceStatusMap.LATE;
              attendanceReason = "تأخر";
            } else if (attRand < 0.85) {
              tutorAttendance = AttendanceStatusMap.ATTENDED;
              studentAttendance = AttendanceStatusMap.ABSENT_EXCUSED;
              attendanceReason = "مرض";
            } else if (attRand < 0.95) {
              tutorAttendance = AttendanceStatusMap.ATTENDED;
              studentAttendance = AttendanceStatusMap.ABSENT_UNEXCUSED;
            } else {
              tutorAttendance = AttendanceStatusMap.LATE;
              studentAttendance = AttendanceStatusMap.ATTENDED;
            }
          } else if (rand < 0.85) {
            sessionStatus = SessionStatusMap.CANCELLED;
            tutorAttendance = AttendanceStatusMap.CANCELLED;
            studentAttendance = AttendanceStatusMap.CANCELLED;
            attendanceReason = "إلغاء من قبل المعلم";
          } else {
            sessionStatus = SessionStatusMap.RESCHEDULED;
          }
        } else {
          // Future session – only scheduled
          sessionStatus = SessionStatusMap.SCHEDULED;
        }

        const session = await db.session.create({
          data: {
            startTime,
            endTime,
            durationMinutes: duration,
            status: sessionStatus,
            topic: randomElement([
              "Surah Al-Baqarah",
              "Tajweed Rules",
              "Revision",
              "New Lesson",
              null,
            ]),
            notes: Math.random() < 0.2 ? "Good progress" : null,
            isTrial: student.status === StudentStatusMap.trial,
            studentId,
            tutorId,
            academyId: academy.id,
          },
        });

        if (tutorAttendance !== null && studentAttendance !== null) {
          await db.attendance.create({
            data: {
              sessionId: session.id,
              tutorAttendanceStatus: tutorAttendance,
              studentAttendanceStatus: studentAttendance,
              reason: attendanceReason,
            },
          });
        }
      }

      // Create recurring pattern for 3 future sessions (this week)
      const startFuture = now.add(1, "day");
      const pattern = await db.recurringPattern.create({
        data: {
          daysOfWeek: [startFuture.day()],
          startTime: startFuture.hour(10).minute(0).second(0).toDate(),
          durationMinutes: 60,
          startDate: startFuture.toDate(),
          endDate: now.add(1, "week").toDate(),
          studentId,
          tutorId,
          academyId: academy.id,
        },
      });

      // Generate the 3 future sessions from the pattern
      for (let i = 0; i < 3; i++) {
        const sessionDate = now.add(i + 1, "day");
        const startTime = sessionDate.hour(10).minute(0).second(0).toDate();
        const endTime = sessionDate.add(60, "minute").toDate();
        await db.session.create({
          data: {
            startTime,
            endTime,
            durationMinutes: 60,
            status: SessionStatusMap.SCHEDULED,
            topic: "Future session",
            isTrial: student.status === StudentStatusMap.trial,
            studentId,
            tutorId,
            academyId: academy.id,
            recurringPatternId: pattern.id,
          },
        });
      }
    }
    console.log(`  ✅ Created sessions for all students`);

    // Create revenue records for subscribed students (payments over last 6 months)
    const subscribedStudents = students.filter(
      (s) => s.status === StudentStatusMap.subscribed,
    );
    for (const student of subscribedStudents) {
      const temp = await db.student.findUnique({ where: { id: student.id } });
      const planId = temp?.planId;
      if (!planId) return;
      const plan = await db.plan.findFirst({
        where: {
          id: planId,
        },
      });
      if (!plan) continue;
      const numPayments = Math.floor(Math.random() * 6) + 1; // 1-6
      for (let p = 0; p < numPayments; p++) {
        const paymentDate = randomDate(
          dayjs.utc().subtract(6, "month").toDate(),
          dayjs.utc().toDate(),
        );
        const status =
          Math.random() > 0.2
            ? PaymentStatusMap.PAID
            : PaymentStatusMap.PENDING;
        const method = randomElement([
          PaymentMethodMap.CASH,
          PaymentMethodMap.CARD,
          PaymentMethodMap.BANK_TRANSFER,
          PaymentMethodMap.ONLINE,
          null,
        ]);
        await db.revenue.create({
          data: {
            amount: plan.price,
            currencyId: sar.id,
            status,
            method: method !== null ? method : null,
            date: paymentDate,
            dueDate: null,
            description: `Subscription payment`,
            channel: randomElement(["online", "manual", null]),
            notes: null,
            invoiceUrl:
              Math.random() > 0.5
                ? `https://invoice.example.com/${student.id}`
                : null,
            studentId: student.id,
            planId: plan.id,
            recordedBy: null,
          },
        });
      }
    }
    console.log(`  ✅ Created revenues for subscribed students`);

    for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
      const expenseMonth = dayjs.utc().subtract(monthOffset, "month").date(15);

      // Rent
      await db.expense.create({
        data: {
          date: expenseMonth.toDate(),
          description: "إيجار المكتب",
          costCenter: randomElement(COST_CENTERS),
          amount: 3000,
          currencyId: sar.id,
          method: PaymentMethodMap.BANK_TRANSFER,
          status: PaymentStatusMap.PAID,
          invoiceUrl: null,
          notes: null,
          tutorId: null,
          salaryMonth: null,
          academyId: academy.id,
          recordedBy: null,
        },
      });

      // Marketing
      await db.expense.create({
        data: {
          date: expenseMonth.toDate(),
          description: "إعلانات فيسبوك",
          costCenter: "تسويق",
          amount: 800,
          currencyId: sar.id,
          method: PaymentMethodMap.ONLINE,
          status:
            Math.random() > 0.3
              ? PaymentStatusMap.PAID
              : PaymentStatusMap.PENDING,
          invoiceUrl: null,
          notes: null,
          tutorId: null,
          salaryMonth: null,
          academyId: academy.id,
          recordedBy: null,
        },
      });

      // Software
      await db.expense.create({
        data: {
          date: expenseMonth.toDate(),
          description: "اشتراك Zoom",
          costCenter: "أدوات وبرمجيات",
          amount: 400,
          currencyId: sar.id,
          method: PaymentMethodMap.CARD,
          status: PaymentStatusMap.PAID,
          invoiceUrl: null,
          notes: "اشتراك شهري",
          tutorId: null,
          salaryMonth: null,
          academyId: academy.id,
          recordedBy: null,
        },
      });
    }

    // Tutor salary expenses for last 2 months
    for (const tutorId of tutorIds) {
      const tutor = await db.tutor.findUnique({
        where: { id: tutorId },
        include: { user: true },
      });
      if (!tutor) continue;
      for (let monthOffset = 1; monthOffset >= 0; monthOffset--) {
        const salaryMonth = dayjs.utc().subtract(monthOffset, "month").date(28);
        const monthStr = salaryMonth.format("YYYY-MM");
        const start = salaryMonth.startOf("month").toDate();
        const end = salaryMonth.endOf("month").toDate();
        // Count sessions taught by this tutor in that month
        const sessionsCount = await db.session.count({
          where: {
            tutorId,
            startTime: { gte: start, lt: end },
            status: SessionStatusMap.COMPLETED,
          },
        });
        if (sessionsCount > 0) {
          const salaryAmount = sessionsCount * tutor.pricePerSession;
          await db.expense.create({
            data: {
              date: salaryMonth.toDate(),
              description: `راتب شهر ${monthStr}`,
              costCenter: "رواتب",
              amount: salaryAmount,
              currencyId: sar.id,
              method: PaymentMethodMap.BANK_TRANSFER,
              status:
                Math.random() > 0.3
                  ? PaymentStatusMap.PAID
                  : PaymentStatusMap.PENDING,
              invoiceUrl: null,
              notes: null,
              tutorId: tutor.id,
              salaryMonth: monthStr,
              academyId: academy.id,
              recordedBy: null,
            },
          });
        }
      }
    }
    console.log(`  ✅ Created expenses for academy`);
  }

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
