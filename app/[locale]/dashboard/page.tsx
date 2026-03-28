import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { StudentStatus } from "@/types/student";
import { AttendanceStatus } from "@/types/session";
import { PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";
import { HistoryActionType, TargetType } from "@/types/history";
import DashboardClient from "@/components/dashboard/overview/viewer";

export default async function DashboardPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;

  const now = dayjs.utc();
  const today = now.startOf("day");
  const startOfWeek = now.startOf("week");
  const endOfWeek = now.endOf("week");
  const startOfLastWeek = startOfWeek.subtract(1, "week");
  const endOfLastWeek = endOfWeek.subtract(1, "week");

  const startOfMonth = now.startOf("month");
  const endOfMonth = now.endOf("month");
  const startOfLastMonth = startOfMonth.subtract(1, "month");
  const endOfLastMonth = endOfMonth.subtract(1, "month");

  const academy = await db.academy.findUnique({
    where: { id: academyId },
    include: { defaultCurrency: true },
  });
  if (!academy || !academy.defaultCurrency) {
    throw new Error("Academy default currency not set");
  }
  const defaultCurrencyId = academy.defaultCurrencyId!;
  const defaultCurrencyCode = academy.defaultCurrency.code;

  // Get conversion rates for this academy
  const rates = await db.academyCurrencyRate.findMany({
    where: { academyId },
  });
  const rateMap = new Map<number, number>();
  rates.forEach((r) => rateMap.set(r.currencyId, r.rate));

  const convertToDefault = (amount: number, currencyId: number) => {
    if (currencyId === defaultCurrencyId) return amount;
    const rate = rateMap.get(currencyId);
    if (!rate) {
      console.warn(
        `No conversion rate for currency ${currencyId}, using amount as is`,
      );
      return amount;
    }
    return amount * rate;
  };

  const [
    totalStudents,
    totalStudentsPrev,
    subscribedStudents,
    subscribedPrev,
    trialStudents,
    trialPrev,
    leadStudents,
    leadPrev,
    newStudentsThisWeek,
    newStudentsLastWeek,
    activeTutors,
    activeTutorsPrev,
    totalSupervisors,
    supervisorsPrev,
  ] = await Promise.all([
    db.student.count({ where: { academyId } }),
    db.student.count({
      where: { academyId, createdAt: { lt: startOfMonth.toDate() } },
    }),
    db.student.count({
      where: { academyId, status: StudentStatus.subscribed },
    }),
    db.student.count({
      where: {
        academyId,
        status: StudentStatus.subscribed,
        createdAt: { lt: startOfMonth.toDate() },
      },
    }),
    db.student.count({ where: { academyId, status: StudentStatus.trial } }),
    db.student.count({
      where: {
        academyId,
        status: StudentStatus.trial,
        createdAt: { lt: startOfMonth.toDate() },
      },
    }),
    db.student.count({ where: { academyId, status: StudentStatus.lead } }),
    db.student.count({
      where: {
        academyId,
        status: StudentStatus.lead,
        createdAt: { lt: startOfMonth.toDate() },
      },
    }),
    db.student.count({
      where: {
        academyId,
        createdAt: { gte: startOfWeek.toDate(), lte: endOfWeek.toDate() },
      },
    }),
    db.student.count({
      where: {
        academyId,
        createdAt: {
          gte: startOfLastWeek.toDate(),
          lte: endOfLastWeek.toDate(),
        },
      },
    }),
    db.tutor.count({ where: { academyId, active: true } }),
    db.tutor.count({
      where: {
        academyId,
        active: true,
        createdAt: { lt: startOfMonth.toDate() },
      },
    }),
    db.supervisor.count({ where: { academyId } }),
    db.supervisor.count({
      where: { academyId, createdAt: { lt: startOfMonth.toDate() } },
    }),
  ]);

  const thirtyDaysAgo = now.subtract(30, "day");
  const sixtyDaysAgo = now.subtract(60, "day");

  // Helper to run raw SQL for lead denominator
  async function countLeadsActiveInPeriod(
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(DISTINCT "targetId") as count
    FROM "History" h
    WHERE h."academyId" = ${academyId}
      AND h."targetType" = ${TargetType.Student}
      AND h."action" = ${HistoryActionType.LeadCreated}
      AND h."createdAt" < ${end}
      AND NOT EXISTS (
        SELECT 1 FROM "History" conv
        WHERE conv."targetId" = h."targetId"
          AND conv."targetType" = ${TargetType.Student}
          AND conv."academyId" = ${academyId}
          AND conv."action" IN (${HistoryActionType.LeadToTrial}, ${HistoryActionType.LeadToSubscription})
          AND conv."createdAt" < ${start}
      )
  `;
    return Number(result[0]?.count ?? 0);
  }

  const revenuesThisMonth = await db.revenue.findMany({
    where: {
      student: { academyId },
      date: { gte: startOfMonth.toDate(), lte: endOfMonth.toDate() },
      status: PaymentStatus.PAID,
    },
    select: { amount: true, currencyId: true },
  });
  const revenueThisMonth = revenuesThisMonth.reduce(
    (sum, r) => sum + convertToDefault(r.amount, r.currencyId),
    0,
  );

  const revenuesPrevMonth = await db.revenue.findMany({
    where: {
      student: { academyId },
      date: { gte: startOfLastMonth.toDate(), lte: endOfLastMonth.toDate() },
      status: PaymentStatus.PAID,
    },
    select: { amount: true, currencyId: true },
  });
  const revenuePrevMonth = revenuesPrevMonth.reduce(
    (sum, r) => sum + convertToDefault(r.amount, r.currencyId),
    0,
  );

  // Expenses (convert to default currency)
  const expensesThisMonth = await db.expense.findMany({
    where: {
      academyId,
      date: { gte: startOfMonth.toDate(), lte: endOfMonth.toDate() },
      status: PaymentStatus.PAID,
    },
    select: { amount: true, currencyId: true },
  });
  const expenseThisMonth = expensesThisMonth.reduce(
    (sum, e) => sum + convertToDefault(e.amount, e.currencyId),
    0,
  );

  const expensesPrevMonth = await db.expense.findMany({
    where: {
      academyId,
      date: { gte: startOfLastMonth.toDate(), lte: endOfLastMonth.toDate() },
      status: PaymentStatus.PAID,
    },
    select: { amount: true, currencyId: true },
  });
  const expensePrevMonth = expensesPrevMonth.reduce(
    (sum, e) => sum + convertToDefault(e.amount, e.currencyId),
    0,
  );

  // Helper to count trials active in period
  async function countTrialsActiveInPeriod(
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(DISTINCT h."targetId") as count
    FROM "History" h
    WHERE h."academyId" = ${academyId}
      AND h."targetType" = ${TargetType.Student}
      AND h."action" = ${HistoryActionType.LeadToTrial}
      AND h."createdAt" < ${end}
      AND NOT EXISTS (
        SELECT 1 FROM "History" conv
        WHERE conv."targetId" = h."targetId"
          AND conv."targetType" = ${TargetType.Student}
          AND conv."academyId" = ${academyId}
          AND conv."action" = ${HistoryActionType.TrialToSubscription}
          AND conv."createdAt" < ${start}
      )
  `;
    return Number(result[0]?.count ?? 0);
  }

  // Get numerators (same as before)
  const [leadToTrialCount, leadToTrialCountPrev] = await Promise.all([
    db.history.count({
      where: {
        academyId,
        action: HistoryActionType.LeadToTrial,
        createdAt: { gte: thirtyDaysAgo.toDate(), lt: now.toDate() },
      },
    }),
    db.history.count({
      where: {
        academyId,
        action: HistoryActionType.LeadToTrial,
        createdAt: { gte: sixtyDaysAgo.toDate(), lt: thirtyDaysAgo.toDate() },
      },
    }),
  ]);

  const [trialToSubscribedCount, trialToSubscribedCountPrev] =
    await Promise.all([
      db.history.count({
        where: {
          academyId,
          action: HistoryActionType.TrialToSubscription,
          createdAt: { gte: thirtyDaysAgo.toDate(), lt: now.toDate() },
        },
      }),
      db.history.count({
        where: {
          academyId,
          action: HistoryActionType.TrialToSubscription,
          createdAt: { gte: sixtyDaysAgo.toDate(), lt: thirtyDaysAgo.toDate() },
        },
      }),
    ]);

  // Get denominators
  const totalLeadsLast30 = await countLeadsActiveInPeriod(
    thirtyDaysAgo.toDate(),
    now.toDate(),
  );
  const totalLeadsPrev30 = await countLeadsActiveInPeriod(
    sixtyDaysAgo.toDate(),
    thirtyDaysAgo.toDate(),
  );
  const totalTrialsLast30 = await countTrialsActiveInPeriod(
    thirtyDaysAgo.toDate(),
    now.toDate(),
  );
  const totalTrialsPrev30 = await countTrialsActiveInPeriod(
    sixtyDaysAgo.toDate(),
    thirtyDaysAgo.toDate(),
  );

  // Calculate rates
  const leadToTrialRate =
    totalLeadsLast30 > 0 ? (leadToTrialCount / totalLeadsLast30) * 100 : 0;
  const leadToTrialRatePrev =
    totalLeadsPrev30 > 0 ? (leadToTrialCountPrev / totalLeadsPrev30) * 100 : 0;
  const trialToSubscribedRate =
    totalTrialsLast30 > 0
      ? (trialToSubscribedCount / totalTrialsLast30) * 100
      : 0;
  const trialToSubscribedRatePrev =
    totalTrialsPrev30 > 0
      ? (trialToSubscribedCountPrev / totalTrialsPrev30) * 100
      : 0;

  const students = await db.student.findMany({
    where: { academyId, status: StudentStatus.subscribed },
    include: {
      sessions: {
        where: { startTime: { lte: dayjs().toDate() } },
        include: { attendance: true },
        orderBy: { startTime: "desc" },
        take: 1,
      },
      subscriptions: {
        where: { status: SubscriptionStatus.active },
        include: { plan: true },
      },
    },
  });

  const atRiskStudents = students
    .filter((student) => {
      const lastSession = student.sessions[0];
      const lastSessionAbsentUnexcused =
        lastSession?.attendance?.studentAttendanceStatus ===
        AttendanceStatus.ABSENT_UNEXCUSED;
      const hasActiveSubscription = student.subscriptions.length > 0;
      const subscription = student.subscriptions[0];
      const daysUntilRenewal = subscription?.endDate
        ? dayjs(subscription.endDate).diff(now, "day")
        : 30;
      const latePayment = hasActiveSubscription && daysUntilRenewal < 0;
      const nearRenewal =
        hasActiveSubscription && daysUntilRenewal >= 0 && daysUntilRenewal <= 7;
      return lastSessionAbsentUnexcused || latePayment || nearRenewal;
    })
    .map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      reason: s.subscriptions[0]?.endDate
        ? dayjs(s.subscriptions[0].endDate).isBefore(now)
          ? "منتهي الاشتراك"
          : "اقتراب نهاية الاشتراك"
        : "غياب بدون عذر",
    }));

  // ---------- Attendance Sheet ----------
  const todaySessions = await db.session.findMany({
    where: {
      academyId,
      startTime: { gte: today.toDate(), lt: today.add(1, "day").toDate() },
      attendance: null,
    },
    include: {
      student: { select: { id: true, name: true, phone: true } },
    },
  });

  // ---------- Reconciliation ----------
  const activeSubscriptions = await db.subscription.findMany({
    where: {
      student: { academyId },
      status: SubscriptionStatus.active,
    },
    include: {
      student: { select: { id: true, name: true, phone: true } },
      plan: { select: { title: true, price: true } },
    },
  });

  const latePayments = activeSubscriptions
    .filter((sub) => {
      if (sub.endDate && dayjs(sub.endDate).isBefore(now, "day")) return true;
      const defaultEnd = dayjs(sub.startDate).add(30, "day");
      return defaultEnd.isBefore(now, "day");
    })
    .map((sub) => ({
      id: sub.studentId,
      studentName: sub.student.name,
      phone: sub.student.phone,
      planTitle: sub.plan.title,
      amountDue: sub.plan.price,
      daysOverdue: sub.endDate
        ? Math.abs(dayjs(sub.endDate).diff(now, "day"))
        : Math.abs(dayjs(sub.startDate).add(30, "day").diff(now, "day")),
    }));

  const nearEndSubscriptions = activeSubscriptions
    .filter((sub) => {
      const end = sub.endDate || dayjs(sub.startDate).add(30, "day");
      const daysLeft = dayjs(end).diff(now, "day");
      return daysLeft >= 0 && daysLeft <= 7;
    })
    .map((sub) => ({
      id: sub.studentId,
      studentName: sub.student.name,
      phone: sub.student.phone,
      planTitle: sub.plan.title,
      endDate: (
        dayjs(sub.endDate) || dayjs(sub.startDate).add(30, "day")
      ).format("YYYY-MM-DD"),
      daysLeft: dayjs(sub.endDate || dayjs(sub.startDate).add(30, "day")).diff(
        now,
        "day",
      ),
    }));

  // ---------- Reports Sheet ----------
  const sessionsWithoutReport = await db.session.findMany({
    where: {
      academyId,
      startTime: { gte: today.toDate(), lt: today.add(1, "day").toDate() },
      sessionReport: null,
    },
    include: {
      student: { select: { name: true } },
      tutor: { include: { user: { select: { name: true, phone: true } } } },
    },
  });

  // Helper to compute percent change
  const calcPercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const stats = {
    totalStudents: {
      value: totalStudents,
      change: calcPercentChange(totalStudents, totalStudentsPrev),
    },
    subscribedStudents: {
      value: subscribedStudents,
      change: calcPercentChange(subscribedStudents, subscribedPrev),
    },
    trialStudents: {
      value: trialStudents,
      change: calcPercentChange(trialStudents, trialPrev),
    },
    leadStudents: {
      value: leadStudents,
      change: calcPercentChange(leadStudents, leadPrev),
    },
    newStudentsThisWeek: {
      value: newStudentsThisWeek,
      change: calcPercentChange(newStudentsThisWeek, newStudentsLastWeek),
    },
    activeTutors: {
      value: activeTutors,
      change: calcPercentChange(activeTutors, activeTutorsPrev),
    },
    totalSupervisors: {
      value: totalSupervisors,
      change: calcPercentChange(totalSupervisors, supervisorsPrev),
    },
    revenueThisMonth: {
      value: revenueThisMonth,
      change: calcPercentChange(revenueThisMonth, revenuePrevMonth),
    },
    expenseThisMonth: {
      value: expenseThisMonth,
      change: calcPercentChange(expenseThisMonth, expensePrevMonth),
    },
    leadToTrialRate: {
      value: leadToTrialRate,
      change: leadToTrialRate - leadToTrialRatePrev,
    },
    trialToSubscribedRate: {
      value: trialToSubscribedRate,
      change: trialToSubscribedRate - trialToSubscribedRatePrev,
    },
  };

  const tutors = await db.tutor.findMany({
    where: { academyId, active: true },
    include: {
      user: true,
    },
  });
  const currencies = await db.currency.findMany();
  const specialities = await db.speciality.findMany();
  const plans = await db.plan.findMany({ where: { academyId } });
  const allStudents = await db.student.findMany({
    where: { academyId },
  });

  return (
    <DashboardClient
      stats={stats}
      atRiskStudents={atRiskStudents}
      attendanceSheet={todaySessions.map((s) => ({
        sessionId: s.id,
        studentId: s.student.id,
        studentName: s.student.name,
        studentPhone: s.student.phone,
        startTime: s.startTime.toISOString(),
      }))}
      latePayments={latePayments}
      nearEndSubscriptions={nearEndSubscriptions}
      reportsSheet={sessionsWithoutReport.map((s) => ({
        sessionId: s.id,
        tutorId: s.tutor.id,
        tutorName: s.tutor.user.name || "",
        tutorPhone: s.tutor.user.phone,
        studentName: s.student.name,
        startTime: s.startTime.toISOString(),
      }))}
      academyId={academyId}
      plans={plans.map((p) => ({ id: p.id, title: p.title }))}
      currencies={currencies.map((c) => ({ id: c.id, name: c.name }))}
      tutors={tutors.map((t) => ({ id: t.id, name: t.user.name }))}
      students={allStudents.map((t) => ({ id: t.id, name: t.name }))}
      specialities={specialities.map((s) => ({ id: s.id, title: s.title }))}
      defaultCurrency={{
        code: defaultCurrencyCode,
        symbol: academy.defaultCurrency.symbol,
        name: academy.defaultCurrency.name,
      }}
    />
  );
}
