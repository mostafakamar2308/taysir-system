"use server";

import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";
import { StudentStatus } from "@/types/student";
import { revalidatePath } from "next/cache";
import { Role } from "@/types/user";
import { user } from "@/lib/auth";
import { withResult, fail } from "@/lib/action-result";

// ---------- Helpers ----------
async function getConversionMap(academyId: number) {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  if (!academy?.defaultCurrencyId) return fail("العملة الافتراضية غير محددة");

  const rates = await db.academyCurrencyRate.findMany({
    where: { academyId },
  });
  const map = new Map<number, number>();
  rates.forEach((r) => map.set(r.currencyId, r.rate));
  return { defaultCurrencyId: academy.defaultCurrencyId, rateMap: map };
}

function convert(
  amount: number,
  currencyId: number,
  defaultCurrencyId: number,
  rateMap: Map<number, number>,
) {
  if (currencyId === defaultCurrencyId) return amount;
  const rate = rateMap.get(currencyId);
  return rate ? amount * rate : amount;
}
type DateRange = { start: Date; end: Date };

function getDateRange(
  period: "all" | "year" | "month",
  year: number,
  month: number,
): DateRange | null {
  if (period === "all") return null;
  const start = dayjs()
    .year(year)
    .month(period === "year" ? 0 : month - 1)
    .startOf(period === "year" ? "year" : "month")
    .toDate();
  const end = dayjs(start)
    .add(1, period === "year" ? "year" : "month")
    .toDate();
  return { start, end };
}

// ---------- Alert Data ----------
export interface DashboardAlerts {
  negativeProfit: boolean;
  overdueRevenueCount: number;
  upcomingRenewals: number;
  overdueRenewals: number;
}

export const getDashboardAlerts = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversionMap(academyId);
    const now = dayjs().toDate();
    const upcomingDays = 7;

    const revWhere: {
      academyId: number;
      status: PaymentStatus;
      dueDate?: { gte: Date; lt: Date };
    } = { academyId, status: PaymentStatus.PAID };

    const expWhere: {
      academyId: number;
      status: PaymentStatus;
      date?: { gte: Date; lt: Date };
    } = { academyId, status: PaymentStatus.PAID };
    if (dateRange) {
      revWhere.dueDate = { gte: dateRange.start, lt: dateRange.end };
      expWhere.date = { gte: dateRange.start, lt: dateRange.end };
    }
    const [revenues, expenses] = await Promise.all([
      db.revenue.findMany({
        where: revWhere,
        select: { amount: true, currencyId: true },
      }),
      db.expense.findMany({
        where: expWhere,
        select: { amount: true, currencyId: true },
      }),
    ]);
    const totalRevenue = revenues.reduce(
      (sum, r) =>
        sum + convert(r.amount, r.currencyId, defaultCurrencyId, rateMap),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, e) =>
        sum + convert(e.amount, e.currencyId, defaultCurrencyId, rateMap),
      0,
    );

    // Overdue revenue count (pending, dueDate < now)
    const overdueRevenues = await db.revenue.findMany({
      where: {
        academyId,
        status: PaymentStatus.PENDING,
        dueDate: { lt: now },
        ...(dateRange ? { dueDate: { gte: dateRange.start, lt: now } } : {}),
      },
      select: { id: true },
    });

    // Renewal subscriptions – active subscriptions with approaching/passed billing dates
    const activeSubs = await db.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        groupStudent: { group: { academyId } },
      },
      select: { nextBillingDate: true, endDate: true },
    });
    let upcoming = 0;
    let overdue = 0;
    activeSubs.forEach((s) => {
      const billing = s.nextBillingDate ?? s.endDate;
      if (!billing) return;
      const billingDay = dayjs(billing);
      if (billingDay.isAfter(now) && billingDay.isBefore(dayjs(now).add(upcomingDays, "day"))) {
        upcoming++;
      } else if (billingDay.isBefore(now)) {
        overdue++;
      }
    });

    return {
      negativeProfit: totalRevenue - totalExpenses < 0,
      overdueRevenueCount: overdueRevenues.length,
      upcomingRenewals: upcoming,
      overdueRenewals: overdue,
    };
  },
);

// ---------- KPI Data ----------
export interface DashboardKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingRevenue: number;
  activeSubscriptionCount: number;
  ltv: number;
  arps: number;
}

export const getDashboardKPIs = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversionMap(academyId);

    const revWhere: {
      academyId: number;
      status: PaymentStatus;
      dueDate?: { gte: Date; lt: Date };
    } = { academyId, status: PaymentStatus.PAID };

    const expWhere: {
      academyId: number;
      status: PaymentStatus;
      date?: { gte: Date; lt: Date };
    } = { academyId, status: PaymentStatus.PAID };

    const revPendingWhere: {
      academyId: number;
      status: PaymentStatus;
      dueDate?: { gte: Date; lt: Date };
    } = { academyId, status: PaymentStatus.PENDING };

    if (dateRange) {
      revWhere.dueDate = { gte: dateRange.start, lt: dateRange.end };
      expWhere.date = { gte: dateRange.start, lt: dateRange.end };
      revPendingWhere.dueDate = { gte: dateRange.start, lt: dateRange.end };
    }

    const [revenues, expenses, revenuesPending] = await Promise.all([
      db.revenue.findMany({
        where: revWhere,
        select: { amount: true, currencyId: true, studentId: true },
      }),
      db.expense.findMany({
        where: expWhere,
        select: { amount: true, currencyId: true },
      }),
      db.revenue.findMany({
        where: revPendingWhere,
        select: { amount: true, currencyId: true },
      }),
    ]);

    const totalRevenue = revenues.reduce(
      (s, r) => s + convert(r.amount, r.currencyId, defaultCurrencyId, rateMap),
      0,
    );
    const totalExpenses = expenses.reduce(
      (s, e) => s + convert(e.amount, e.currencyId, defaultCurrencyId, rateMap),
      0,
    );
    const outstandingRevenue = revenuesPending.reduce(
      (s, r) => s + convert(r.amount, r.currencyId, defaultCurrencyId, rateMap),
      0,
    );

    const activeSubscriptions = await db.subscription.count({
      where: {
        status: SubscriptionStatus.active,
        groupStudent: { group: { academyId } },
      },
    });

    // LTV – all time average per student with any PAID revenue
    const allRevenues = await db.revenue.findMany({
      where: { academyId, status: PaymentStatus.PAID },
      select: { studentId: true, amount: true, currencyId: true },
    });
    const studentTotals = new Map<number, number>();
    allRevenues.forEach((r) => {
      const conv = convert(r.amount, r.currencyId, defaultCurrencyId, rateMap);
      studentTotals.set(
        r.studentId,
        (studentTotals.get(r.studentId) || 0) + conv,
      );
    });
    const ltv =
      studentTotals.size > 0
        ? [...studentTotals.values()].reduce((a, b) => a + b, 0) /
          studentTotals.size
        : 0;

    // ARPS = total PAID revenue in period / number of distinct paying students in period
    const payingStudentIds = new Set(revenues.map((r) => r.studentId));
    const arps =
      payingStudentIds.size > 0 ? totalRevenue / payingStudentIds.size : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      outstandingRevenue,
      activeSubscriptionCount: activeSubscriptions,
      ltv,
      arps,
    };
  },
);

export interface QuarterlyKPIs {
  ltgp: number; // Lifetime Gross Profit
  arppu: number; // Average Revenue Per Paying User (per month)
  cac: number; // Total marketing expenses for the quarter
  churnRate: number; // Average monthly churn rate (0-1)
}

export const getQuarterlyKPIs = withResult(
  async (
    academyId: number,
    year: number,
    quarter: 1 | 2 | 3 | 4,
  ) => {
    // 1. Define quarter boundaries
    const startMonth = (quarter - 1) * 3 + 1; // 1,4,7,10
    const startDate = dayjs.utc(`${year}-${startMonth}-01`).startOf("month");
    const endDate = startDate.add(3, "months").subtract(1, "day").endOf("day");

    const monthsInQuarter = [
      startDate.clone(),
      startDate.clone().add(1, "month"),
      startDate.clone().add(2, "month"),
    ];

    // 2. Get currency conversion map
    const { defaultCurrencyId, rateMap } = await getConversionMap(academyId);

    // 3. Fetch all paid revenues in quarter
    const revenues = await db.revenue.findMany({
      where: {
        academyId,
        status: PaymentStatus.PAID,
        dueDate: { gte: startDate.toDate(), lt: endDate.toDate() },
      },
      select: { amount: true, currencyId: true, studentId: true, dueDate: true },
    });

    // 4. Fetch all paid expenses in quarter (with costCenter)
    const expenses = await db.expense.findMany({
      where: {
        academyId,
        status: PaymentStatus.PAID,
        date: { gte: startDate.toDate(), lt: endDate.toDate() },
      },
      select: {
        amount: true,
        currencyId: true,
        costCenter: { select: { title: true } },
      },
    });

    // 5. Fetch subscriptions for active enrollment calculation (entire quarter range + margin)
    const subscriptions = await db.subscription.findMany({
      where: {
        groupStudent: { group: { academyId } },
        startDate: { lte: endDate.toDate() },
        OR: [{ endDate: null }, { endDate: { gte: startDate.toDate() } }],
      },
      select: { groupStudentId: true, startDate: true, endDate: true },
    });

    // 6. Compute paying student-months and total revenue
    let totalPayingStudentMonths = 0;
    let totalRevenue = 0;

    for (const rev of revenues) {
      totalRevenue += convert(
        rev.amount,
        rev.currencyId,
        defaultCurrencyId,
        rateMap,
      );
    }

    for (const monthStart of monthsInQuarter) {
      const monthEnd = monthStart.endOf("month");
      const payingStudents = new Set(
        revenues
          .filter((r) => {
            const due = dayjs(r.dueDate);
            return due.isAfter(monthStart) && due.isBefore(monthEnd);
          })
          .map((r) => r.studentId),
      );
      totalPayingStudentMonths += payingStudents.size;
    }

    // 7. Compute direct expenses (مرتبات الموظفين + اشتراكات برامج)
    const directCostTitles = ["مرتبات الموظفين (غير المعلمين)", "إشتراكات برامج"];
    let totalDirectExpenses = 0;
    for (const exp of expenses) {
      const title = exp.costCenter?.title;
      if (title && directCostTitles.includes(title)) {
        totalDirectExpenses += convert(
          exp.amount,
          exp.currencyId,
          defaultCurrencyId,
          rateMap,
        );
      }
    }

    // 8. ARPPU and direct cost per user per month
    let arppu = 0;
    let directCostPerUser = 0;
    if (totalPayingStudentMonths > 0) {
      arppu = totalRevenue / totalPayingStudentMonths;
      directCostPerUser = totalDirectExpenses / totalPayingStudentMonths;
    }
    const grossProfitPerUser = arppu - directCostPerUser;

    // 9. Compute monthly churn rates (average over quarter)
    let totalMonthlyChurn = 0;
    let validMonths = 0;

    for (const monthStart of monthsInQuarter) {
      const monthEnd = monthStart.endOf("month");
      const startDay = monthStart.toDate();
      const endDay = monthEnd.toDate();

      // Active enrollments at start of month
      const activeAtStart = new Set(
        subscriptions
          .filter((sub) => {
            const subStart = sub.startDate;
            const subEnd = sub.endDate;
            return subStart <= startDay && (subEnd === null || subEnd > startDay);
          })
          .map((sub) => sub.groupStudentId),
      );

      // Active enrollments at end of month
      const activeAtEnd = new Set(
        subscriptions
          .filter((sub) => {
            const subStart = sub.startDate;
            const subEnd = sub.endDate;
            return subStart <= endDay && (subEnd === null || subEnd > endDay);
          })
          .map((sub) => sub.groupStudentId),
      );

      const startCount = activeAtStart.size;
      if (startCount === 0) continue;

      let churned = 0;
      for (const enrollment of activeAtStart) {
        if (!activeAtEnd.has(enrollment)) churned++;
      }
      totalMonthlyChurn += churned / startCount;
      validMonths++;
    }

    const avgMonthlyChurn = validMonths > 0 ? totalMonthlyChurn / validMonths : 0;

    // 10. LTGP
    let ltgp = 0;
    if (avgMonthlyChurn > 0 && grossProfitPerUser > 0) {
      ltgp = (1 / avgMonthlyChurn) * grossProfitPerUser;
    }

    // 11. CAC (total marketing expenses)
    const marketingTitles = ["الإعلانات", "تصوير المحتوى"];
    let totalMarketing = 0;
    for (const exp of expenses) {
      const title = exp.costCenter?.title;
      if (title && marketingTitles.includes(title)) {
        totalMarketing += convert(
          exp.amount,
          exp.currencyId,
          defaultCurrencyId,
          rateMap,
        );
      }
    }

    return {
      ltgp: Math.round(ltgp * 100) / 100,
      arppu: Math.round(arppu * 100) / 100,
      cac: Math.round(totalMarketing * 100) / 100,
      churnRate: Math.round(avgMonthlyChurn * 10000) / 10000, // 4 decimal places
    };
  },
);
// ---------- Revenue & Expenses Over Time ----------
export interface TimeSeriesItem {
  date: string;
  revenue: number;
  expenses: number;
}

export const getRevenueExpensesOverTime = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversionMap(academyId);
    const granularity = period === "month" ? "day" : "month";

    const revWhere: {
      academyId: number;
      status: PaymentStatus;
      dueDate?: { gte: Date; lt: Date };
    } = { academyId, status: PaymentStatus.PAID };

    const expWhere: {
      academyId: number;
      status: PaymentStatus;
      date?: { gte: Date; lt: Date };
    } = { academyId, status: PaymentStatus.PAID };

    if (dateRange) {
      revWhere.dueDate = { gte: dateRange.start, lt: dateRange.end };
      expWhere.date = { gte: dateRange.start, lt: dateRange.end };
    }

    const [revenues, expenses] = await Promise.all([
      db.revenue.findMany({
        where: revWhere,
        select: { amount: true, currencyId: true, dueDate: true },
      }),
      db.expense.findMany({
        where: expWhere,
        select: { amount: true, currencyId: true, date: true },
      }),
    ]);

    const map = new Map<string, { revenue: number; expenses: number }>();
    const getKey = (d: Date) => {
      if (granularity === "day") return dayjs(d).format("YYYY-MM-DD");
      return dayjs(d).format("YYYY-MM");
    };

    revenues.forEach((r) => {
      const key = getKey(r.dueDate);
      const entry = map.get(key) || { revenue: 0, expenses: 0 };
      entry.revenue += convert(
        r.amount,
        r.currencyId,
        defaultCurrencyId,
        rateMap,
      );
      map.set(key, entry);
    });
    expenses.forEach((e) => {
      const key = getKey(e.date);
      const entry = map.get(key) || { revenue: 0, expenses: 0 };
      entry.expenses += convert(
        e.amount,
        e.currencyId,
        defaultCurrencyId,
        rateMap,
      );
      map.set(key, entry);
    });

    const series = Array.from(map.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
    series.sort((a, b) => a.date.localeCompare(b.date));
    return series;
  },
);

// ---------- Subscription Retention Matrix ----------
export interface RetentionCohort {
  cohortMonth: string;
  month0: number; // % still active in the same month
  month1: number;
  month2: number;
  // ... up to month11 or only months that exist
}

export interface RetentionData {
  matrix: Record<string, number[]>; // cohortMonth -> [month0%, month1%, ...]
  cohortSizes: Record<string, number>; // cohortMonth -> total students in that cohort
}

export const getSubscriptionRetention = withResult(
  async (
    academyId: number,
  ) => {
    const firstSubs = await db.subscription.findMany({
      where: {
        groupStudent: { group: { academyId } },
      },
      select: { groupStudentId: true, startDate: true },
      orderBy: { startDate: "asc" },
    });

    // Get the earliest start date per enrollment
    const enrollmentFirstStart = new Map<number, dayjs.Dayjs>();
    firstSubs.forEach((s) => {
      const d = dayjs(s.startDate);
      if (
        !enrollmentFirstStart.has(s.groupStudentId) ||
        d.isBefore(enrollmentFirstStart.get(s.groupStudentId)!)
      ) {
        enrollmentFirstStart.set(s.groupStudentId, d);
      }
    });

    // Cohort sizes: count enrollments per cohort month
    const cohortSizes: Record<string, number> = {};
    enrollmentFirstStart.forEach((d) => {
      const key = d.format("YYYY-MM");
      cohortSizes[key] = (cohortSizes[key] || 0) + 1;
    });

    // For each enrollment, check which months after cohort it had an active subscription
    const now = dayjs();
    const matrix: Record<string, number[]> = {};

    for (const [groupStudentId, firstDate] of enrollmentFirstStart) {
      const cohortKey = firstDate.format("YYYY-MM");
      if (!matrix[cohortKey]) {
        const monthsDiff = now.diff(firstDate, "month");
        matrix[cohortKey] = new Array(monthsDiff + 1).fill(0);
      }
      const counts = matrix[cohortKey];

      for (let i = 0; i <= now.diff(firstDate, "month"); i++) {
        const monthStart = firstDate.add(i, "month").startOf("month");
        const monthEnd = monthStart.endOf("month");
        const hasActive = await db.subscription.findFirst({
          where: {
            groupStudentId,
            status: SubscriptionStatus.active,
            startDate: { lte: monthEnd.toDate() },
            endDate: { gte: monthStart.toDate() },
          },
        });
        if (hasActive) counts[i]++;
      }
    }

    // Convert counts to percentages
    Object.keys(matrix).forEach((cohort) => {
      const size = cohortSizes[cohort] || 1;
      matrix[cohort] = matrix[cohort].map((c) => Math.round((c / size) * 100));
    });

    return { matrix, cohortSizes };
  },
);

// ---------- Plan Efficiency (Revenue & Students per Plan) ----------
export interface PlanEfficiency {
  planId: number;
  planName: string;
  totalRevenue: number;
  activeStudents: number;
  arps?: number; // average revenue per active student
}

export const getPlanEfficiency = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversionMap(academyId);

    const revWhere: {
      academyId: number;
      status: PaymentStatus;
      planId: { not: null };
      dueDate?: { gte: Date; lt: Date };
    } = {
      academyId,
      status: PaymentStatus.PAID,
      planId: { not: null },
    };

    if (dateRange) {
      revWhere.dueDate = { gte: dateRange.start, lt: dateRange.end };
    }
    const revenues = await db.revenue.findMany({
      where: revWhere,
      select: { amount: true, currencyId: true, planId: true, studentId: true },
    });

    // Group by plan
    const planMap = new Map<
      number,
      { totalRevenue: number; studentSet: Set<number> }
    >();
    revenues.forEach((r) => {
      if (!r.planId) return;
      const conv = convert(r.amount, r.currencyId, defaultCurrencyId, rateMap);
      const entry = planMap.get(r.planId) || {
        totalRevenue: 0,
        studentSet: new Set(),
      };
      entry.totalRevenue += conv;
      entry.studentSet.add(r.studentId);
      planMap.set(r.planId, entry);
    });

    // Get plan names and active student counts (current subscriptions)
    const planIds = [...planMap.keys()];
    const plans = await db.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, title: true },
    });
    const activeStudentCounts = await db.subscription.groupBy({
      by: ["planId"],
      where: {
        planId: { in: planIds },
        status: SubscriptionStatus.active,
        groupStudent: { group: { academyId } },
      },
      _count: { id: true },
    });
    const activeMap = new Map<number, number>();
    activeStudentCounts.forEach((g) => {
      if (g.planId) activeMap.set(g.planId, g._count.id);
    });

    return plans.map((plan) => {
      const entry = planMap.get(plan.id)!;
      const active = activeMap.get(plan.id) || 0;
      return {
        planId: plan.id,
        planName: plan.title,
        totalRevenue: entry.totalRevenue,
        activeStudents: active,
        arps: active > 0 ? entry.totalRevenue / active : 0,
      };
    });
  },
);

// ----- Currency Conversion Helpers -----
async function getConversion(academyId: number) {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  if (!academy?.defaultCurrencyId) return fail("العملة الافتراضية غير محددة");

  const rates = await db.academyCurrencyRate.findMany({
    where: { academyId },
  });
  const map = new Map<number, number>();
  rates.forEach((r) => map.set(r.currencyId, r.rate));
  return { defaultCurrencyId: academy.defaultCurrencyId, rateMap: map };
}

// ----- KPI Data -----
export interface RevenueKPIs {
  revenuePerPlan: { planId: number; planName: string; totalRevenue: number }[];
  totalRevenue: number;
  arps: number;
  revenuePerTutor: {
    tutorId: number;
    tutorName: string;
    totalRevenue: number;
  }[];
  revenuePerMethod: { method: number; totalRevenue: number }[];
}

export const getRevenueKPIs = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
    filters?: { studentId?: number; method?: number },
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversion(academyId);

    const revWhere: {
      academyId: number;
      status: PaymentStatus;
      dueDate?: { gte: Date; lt: Date };
      studentId?: number;
      method?: number;
    } = { academyId, status: PaymentStatus.PAID };

    if (dateRange) revWhere.dueDate = { gte: dateRange.start, lt: dateRange.end };
    if (filters?.studentId) revWhere.studentId = filters.studentId;
    if (filters?.method !== undefined) revWhere.method = filters.method;

    const revenues = await db.revenue.findMany({
      where: revWhere,
      select: {
        amount: true,
        currencyId: true,
        studentId: true,
        planId: true,
        method: true,
        student: {
          select: { user: { select: { name: true } } },
        },
        plan: { select: { id: true, title: true } },
        subscription: {
          select: {
            groupStudent: {
              select: {
                group: {
                  select: {
                    currentTutorId: true,
                    currentTutor: {
                      select: { user: { select: { name: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Revenue per plan
    const planMap = new Map<number, { name: string; total: number }>();
    // Revenue per tutor (via the enrollment's group current tutor)
    const tutorMap = new Map<number, { name: string; total: number }>();
    // Revenue per method
    const methodMap = new Map<number, number>();

    const payingStudentIds = new Set<number>();
    let totalPaidRevenue = 0;

    revenues.forEach((r) => {
      const conv = convert(r.amount, r.currencyId, defaultCurrencyId, rateMap);
      totalPaidRevenue += conv;
      payingStudentIds.add(r.studentId);

      // Plan
      if (r.planId) {
        const e = planMap.get(r.planId) || {
          name: r.plan?.title || "",
          total: 0,
        };
        e.total += conv;
        planMap.set(r.planId, e);
      }

      // Tutor
      const tutorId = r.subscription?.groupStudent.group.currentTutorId;
      if (tutorId) {
        const name =
          r.subscription?.groupStudent.group.currentTutor?.user?.name || "";
        const t = tutorMap.get(tutorId) || { name, total: 0 };
        t.total += conv;
        tutorMap.set(tutorId, t);
      }

      // Method
      if (r.method !== null && r.method !== undefined) {
        methodMap.set(r.method, (methodMap.get(r.method) || 0) + conv);
      }
    });

    const arps =
      payingStudentIds.size > 0 ? totalPaidRevenue / payingStudentIds.size : 0;

    return {
      revenuePerPlan: Array.from(planMap.entries()).map(
        ([planId, { name, total }]) => ({
          planId,
          planName: name,
          totalRevenue: total,
        }),
      ),
      arps,
      revenuePerTutor: Array.from(tutorMap.entries()).map(
        ([tutorId, { name, total }]) => ({
          tutorId,
          tutorName: name,
          totalRevenue: total,
        }),
      ),
      revenuePerMethod: Array.from(methodMap.entries()).map(
        ([method, total]) => ({
          method,
          totalRevenue: total,
        }),
      ),
      totalRevenue: totalPaidRevenue,
    };
  },
);

// ----- Overdue Revenue (pending, dueDate < today) -----
export interface OverdueRevenueItem {
  id: number;
  amount: number;
  defaultAmount: number;
  dueDate: string;
  studentName: string;
  planName?: string;
  method?: number | null;
  studentPhone: string | null;
}

export const getOverdueRevenue = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversion(academyId);

    const now = dayjs().toDate();
    const where: {
      academyId: number;
      status: PaymentStatus;
      dueDate?: { gte?: Date; lt: Date };
    } = {
      academyId,
      status: PaymentStatus.PENDING,
      dueDate: { lt: now },
    };
    if (dateRange) {
      where.dueDate = { gte: dateRange.start, lt: now };
    }

    const revenues = await db.revenue.findMany({
      where,
      include: {
        student: { select: { user: { select: { name: true, phone: true } } } },
        plan: { select: { title: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return revenues.map((r) => ({
      id: r.id,
      amount: r.amount,
      defaultAmount: convert(r.amount, r.currencyId, defaultCurrencyId, rateMap),
      dueDate: dayjs(r.dueDate).format("YYYY-MM-DD"),
      studentName: r.student.user.name || "",
      planName: r.plan?.title,
      method: r.method,
      studentPhone: r.student.user.phone || "",
    }));
  },
);

// ----- Renewal Subscriptions (active subscriptions, upcoming/overdue billing) -----
export interface RenewalSubscription {
  studentId: number;
  studentName: string;
  studentPhone: string | null;
  groupName: string;
  planName: string;
  endDate: string;
  id: number;
  daysLeft: number; // positive if upcoming, negative if overdue
  planPrice: number;
}

export const getRenewalSubscriptions = withResult(
  async (
    academyId: number,
  ) => {
    const subscriptions = await db.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        groupStudent: { group: { academyId } },
      },
      include: {
        groupStudent: {
          select: {
            student: {
              select: { id: true, user: { select: { name: true, phone: true } } },
            },
            group: { select: { title: true } },
          },
        },
        plan: { select: { title: true } },
      },
    });

    const now = dayjs();
    const upcoming: RenewalSubscription[] = [];
    const overdue: RenewalSubscription[] = [];

    subscriptions.forEach((sub) => {
      const billing = sub.nextBillingDate ?? sub.endDate;
      if (!billing) return;
      const end = dayjs(billing);
      const daysLeft = end.diff(now, "day");
      const item: RenewalSubscription = {
        id: sub.id,
        studentId: sub.groupStudent.student.id,
        studentName: sub.groupStudent.student.user.name || "",
        groupName: sub.groupStudent.group.title,
        planName: sub.plan?.title || "",
        endDate: end.format("YYYY-MM-DD"),
        studentPhone: sub.groupStudent.student.user.phone || "",
        daysLeft,
        planPrice: sub.price,
      };
      if (daysLeft <= 7 && daysLeft >= 0) {
        upcoming.push(item);
      } else if (daysLeft < 0) {
        overdue.push(item);
      }
    });

    return { upcoming, overdue };
  },
);

// ----- Revenue History (all revenues) -----
export interface RevenueHistoryItem {
  id: number;
  amount: number;
  defaultAmount: number;
  currency: string;
  status: number;
  method?: number | null;
  dueDate: string;
  studentName: string;
  planName?: string;
  currencyId: number;
  subscriptionId?: number;
}

export const getRevenueHistory = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
    studentId?: number,
    method?: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversion(academyId);

    const where: {
      academyId: number;
      studentId?: number;
      method?: number;
      dueDate?: { gte: Date; lt: Date };
    } = {
      academyId,
    };
    if (dateRange) {
      where.dueDate = { gte: dateRange.start, lt: dateRange.end };
    }
    if (studentId) where.studentId = studentId;
    if (method !== undefined) where.method = method;

    const revenues = await db.revenue.findMany({
      where,
      include: {
        student: { select: { user: { select: { name: true } } } },
        plan: { select: { title: true } },
        currency: { select: { code: true } },
      },
      orderBy: { dueDate: "desc" },
    });

    return revenues.map((r) => ({
      id: r.id,
      amount: r.amount,
      defaultAmount: convert(r.amount, r.currencyId, defaultCurrencyId, rateMap),
      currency: r.currency.code,
      status: r.status,
      method: r.method,
      currencyId: r.currencyId,
      dueDate: dayjs(r.dueDate).format("YYYY-MM-DD"),
      studentName: r.student.user.name || "",
      planName: r.plan?.title,
    }));
  },
);

// ----- Mutations -----
export const markRevenueAsPaid = withResult(async (id: number) => {
  await db.revenue.update({
    where: { id },
    data: { status: PaymentStatus.PAID },
  });
});

// Record a payment against a subscription (creates a Revenue row linked to it).
export const createRevenueForSubscription = withResult(
  async (
    subscriptionId: number,
    opts?: {
      status?: PaymentStatus;
      method?: number;
      date?: string;
      notes?: string;
    },
  ) => {
    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        price: true,
        currencyId: true,
        planId: true,
        status: true,
        groupStudent: {
          select: { studentId: true, group: { select: { academyId: true } } },
        },
      },
    });
    if (!sub) return fail("الاشتراك غير موجود");
    if (sub.status !== SubscriptionStatus.active)
      return fail("الاشتراك غير نشط");

    const revenue = await db.revenue.create({
      data: {
        amount: sub.price,
        currencyId: sub.currencyId,
        academyId: sub.groupStudent.group.academyId,
        studentId: sub.groupStudent.studentId,
        planId: sub.planId,
        subscriptionId: sub.id,
        status: opts?.status ?? PaymentStatus.PAID,
        method: opts?.method ?? 0,
        dueDate: opts?.date ? dayjs.utc(opts.date).toDate() : new Date(),
        notes: opts?.notes,
      },
    });

    revalidatePath("/ar/dashboard");
    return revenue;
  },
);

export const updateRevenue = withResult(
  async (
    id: number,
    data: {
      amount?: number;
      status?: number;
      method?: number;
      dueDate?: string;
      planId?: number;
    },
  ) => {
    await db.revenue.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  },
);

// ----- Expense KPIs -----
export interface ExpensesKPIs {
  totalExpenses: number;
  expensesPerCostCenter: { costCenter: string; total: number }[];
  topExpenses: {
    id: number;
    description: string;
    amount: number;
    costCenter: string | null;
    date: string;
  }[];
  costPerSession: number;
  costPerStudentSubscribed: number;
}

export const getExpensesKPIs = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversion(academyId);

    const expWhere: {
      academyId: number;
      status: PaymentStatus;
      date?: { gte: Date; lt: Date };
    } = { academyId, status: PaymentStatus.PAID };
    if (dateRange) {
      expWhere.date = { gte: dateRange.start, lt: dateRange.end };
    }

    const expenses = await db.expense.findMany({
      where: expWhere,
      select: {
        id: true,
        amount: true,
        currencyId: true,
        costCenter: true,
        description: true,
        date: true,
      },
      orderBy: { amount: "desc" },
    });

    let total = 0;
    const costCenterMap = new Map<string, number>();
    expenses.forEach((e) => {
      const conv = convert(e.amount, e.currencyId, defaultCurrencyId, rateMap);
      total += conv;
      const cc = e.costCenter?.title || "غير محدد";
      costCenterMap.set(cc, (costCenterMap.get(cc) || 0) + conv);
    });

    // Top expenses (top 5 by amount)
    const topExpenses = expenses.slice(0, 5).map((e) => ({
      id: e.id,
      description: e.description,
      amount: convert(e.amount, e.currencyId, defaultCurrencyId, rateMap),
      costCenter: e.costCenter?.title || "غير محدد",
      date: dayjs(e.date).format("YYYY-MM-DD"),
    }));

    const sessionWhere: {
      academyId: number;
      cancelledBy: null;
      startTime?: { gte: Date; lt: Date };
    } = { academyId, cancelledBy: null };
    if (dateRange) {
      sessionWhere.startTime = { gte: dateRange.start, lt: dateRange.end };
    }
    const completedSessions = await db.session.count({ where: sessionWhere });

    const costPerSession =
      completedSessions > 0 ? Number((total / completedSessions).toFixed(2)) : 0;

    // Cost per paying student = total paid expenses / number of currently subscribed students
    const subscribedCount = await db.student.count({
      where: { academyId, status: StudentStatus.subscribed },
    });
    const costPerStudentSubscribed =
      subscribedCount > 0 ? Number((total / subscribedCount).toFixed(2)) : 0;

    return {
      totalExpenses: total,
      expensesPerCostCenter: Array.from(costCenterMap.entries()).map(
        ([costCenter, total]) => ({ costCenter, total }),
      ),
      topExpenses,
      costPerSession,
      costPerStudentSubscribed,
    };
  },
);

// ----- Pending Expenses -----
export interface PendingExpense {
  id: number;
  description: string;
  amount: number;
  defaultAmount: number;
  date: string;
  costCenter: string | null;
  tutorName?: string;
  tutorPhone?: string;
  method: number | null;
}

export const getPendingExpenses = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
    costCenterFilter?: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversion(academyId);

    const where: {
      academyId: number;
      status: PaymentStatus;
      date?: {
        gte: Date;
        lt: Date;
      };
      costCenterId?: number;
    } = { academyId, status: PaymentStatus.PENDING };
    if (dateRange) {
      where.date = { gte: dateRange.start, lt: dateRange.end };
    }
    if (costCenterFilter) where.costCenterId = costCenterFilter;

    const expenses = await db.expense.findMany({
      where,
      include: {
        tutor: { include: { user: { select: { name: true, phone: true } } } },
        costCenter: true,
      },
      orderBy: { date: "asc" },
    });

    return expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      defaultAmount: convert(e.amount, e.currencyId, defaultCurrencyId, rateMap),
      date: dayjs(e.date).format("YYYY-MM-DD"),
      costCenter: e.costCenter?.title || "غير محدد",
      tutorName: e.tutor?.user.name ?? undefined,
      tutorPhone: e.tutor?.user.phone ?? undefined,
      method: e.method,
    }));
  },
);

// ----- Expenses History -----
export interface ExpenseHistoryItem {
  id: number;
  amount: number;
  defaultAmount: number;
  currency: string;
  currencyId: number;
  status: number;
  method: number | null;
  date: string;
  description: string;
  costCenter: string | null;
  tutorName?: string;
  tutorId?: number;
  notes: string | null;
  invoiceUrl: string | null;
}

export const getExpensesHistory = withResult(
  async (
    academyId: number,
    period: "all" | "year" | "month",
    year: number,
    month: number,
    costCenterFilter?: number,
  ) => {
    const dateRange = getDateRange(period, year, month);
    const { defaultCurrencyId, rateMap } = await getConversion(academyId);

    const where: {
      academyId: number;
      date?: {
        gte: Date;
        lt: Date;
      };
      costCenterId?: number;
    } = { academyId };
    if (dateRange) {
      where.date = { gte: dateRange.start, lt: dateRange.end };
    }
    if (costCenterFilter) where.costCenterId = costCenterFilter;

    const expenses = await db.expense.findMany({
      where,
      include: {
        currency: { select: { code: true } },
        tutor: { include: { user: { select: { name: true } } } },
        costCenter: true,
      },
      orderBy: { date: "desc" },
    });

    return expenses.map((e) => ({
      id: e.id,
      amount: e.amount,
      defaultAmount: convert(e.amount, e.currencyId, defaultCurrencyId, rateMap),
      currency: e.currency.code,
      currencyId: e.currencyId,
      status: e.status,
      method: e.method,
      date: dayjs(e.date).format("YYYY-MM-DD"),
      description: e.description,
      costCenter: e.costCenter?.title || "غير محدد",
      tutorName: e.tutor?.user.name ?? undefined,
      tutorId: e.tutorId ?? undefined,
      notes: e.notes,
      invoiceUrl: e.invoiceUrl,
    }));
  },
);

export const markExpenseAsPaid = withResult(async (id: number) => {
  await db.expense.update({
    where: { id },
    data: { status: PaymentStatus.PAID },
  });
});

export const updateExpense = withResult(
  async (
    id: number,
    data: {
      amount?: number;
      status?: number;
      method?: number;
      date?: string;
      description?: string;
      costCenterId?: number | null;
      notes?: string;
    },
  ) => {
    await db.expense.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  },
);

export const getSalaryData = withResult(
  async (
    academyId: number,
    year: number,
    month: number,
    tutorId?: number,
  ) => {
    const { defaultCurrencyId, rateMap } = await getConversion(academyId);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    // 1. Fetch tutors
    const tutors = await db.tutor.findMany({
      where: {
        academyId,
        ...(tutorId ? { id: tutorId } : {}),
      },
      include: { user: { select: { name: true } } },
    });

    // 2. Completed sessions (attended or late, not cancelled)
    const sessions = await db.session.findMany({
      where: {
        academyId,
        cancelledBy: null,
        startTime: { gte: startOfMonth, lt: endOfMonth },
        tutorId: tutorId ? tutorId : { in: tutors.map((t) => t.id) },
      },
      include: { participants: true },
    });

    const privateMinutesMap = new Map<number, number>();
    const groupMinutesMap = new Map<number, number>();
    const earningsMap = new Map<number, number>();
    const sessionCountMap = new Map<number, number>();

    for (const s of sessions) {
      const tid = s.tutorId;
      const count = s.participants.length;
      const dur = s.durationMinutes;
      sessionCountMap.set(tid, (sessionCountMap.get(tid) || 0) + 1);
      earningsMap.set(
        tid,
        (earningsMap.get(tid) || 0) + (s.tutorRate * dur) / 60,
      );
      if (count <= 1) {
        privateMinutesMap.set(tid, (privateMinutesMap.get(tid) || 0) + dur);
      } else {
        groupMinutesMap.set(tid, (groupMinutesMap.get(tid) || 0) + dur);
      }
    }

    // 3. Paid salary expenses
    const paidExpenses = await db.expense.groupBy({
      by: ["tutorId"],
      _sum: { amount: true },
      where: {
        academyId,
        status: PaymentStatus.PAID,
        date: { gte: startOfMonth, lt: endOfMonth },
        tutorId: tutorId ? tutorId : { in: tutors.map((t) => t.id) },
      },
    });
    const paidAmountMap = new Map<number, number>();
    paidExpenses.forEach((g) => {
      if (g.tutorId) paidAmountMap.set(g.tutorId, g._sum.amount || 0);
    });

    // 4. Compute expected salaries
    const tutorSalaries = tutors.map((t) => {
      const privateMin = privateMinutesMap.get(t.id) || 0;
      const groupMin = groupMinutesMap.get(t.id) || 0;
      const expected = earningsMap.get(t.id) || 0;
      const paid = paidAmountMap.get(t.id) || 0;
      const outstanding = Math.max(expected - paid, 0);
      return {
        tutorId: t.id,
        tutorName: t.user.name || "غير معروف",
        privatePricePerHour: t.baseHourlyRate,
        groupPricePerHour: t.baseGroupHourlyRate,
        completedSessions: sessionCountMap.get(t.id) || 0,
        totalMinutes: privateMin + groupMin,
        expectedSalary: expected,
        paidAmount: paid,
        outstanding,
      };
    });

    const totalPaid = Array.from(paidAmountMap.values()).reduce(
      (a, b) => a + b,
      0,
    );

    // 5. Highest paid tutors
    const highestPaidTutors = tutorSalaries
      .filter((ts) => ts.paidAmount > 0)
      .sort((a, b) => b.paidAmount - a.paidAmount)
      .slice(0, 5)
      .map((ts) => ({
        tutorId: ts.tutorId,
        name: ts.tutorName,
        totalPaid: ts.paidAmount,
      }));

    // 6. Avg sessions per tutor
    const tutorsWithSessions = tutorSalaries.filter(
      (ts) => ts.completedSessions > 0,
    );
    const avgSessions =
      tutorsWithSessions.length > 0
        ? tutorsWithSessions.reduce((sum, ts) => sum + ts.completedSessions, 0) /
          tutorsWithSessions.length
        : 0;

    // 7. Avg revenue per tutor (via subscription -> enrollment -> group current tutor)
    const revenues = await db.revenue.findMany({
      where: {
        academyId,
        status: PaymentStatus.PAID,
        dueDate: { gte: startOfMonth, lt: endOfMonth },
        subscription: {
          groupStudent: {
            group: {
              currentTutorId: tutorId
                ? tutorId
                : { in: tutors.map((t) => t.id) },
            },
          },
        },
      },
      select: {
        amount: true,
        currencyId: true,
        subscription: {
          select: {
            groupStudent: {
              select: { group: { select: { currentTutorId: true } } },
            },
          },
        },
      },
    });

    const revenueMap = new Map<number, number>();
    revenues.forEach((r) => {
      const tid = r.subscription?.groupStudent.group.currentTutorId;
      if (!tid) return;
      const conv = convert(r.amount, r.currencyId, defaultCurrencyId, rateMap);
      revenueMap.set(tid, (revenueMap.get(tid) || 0) + conv);
    });

    const revenuePerTutor = Array.from(revenueMap.entries()).map(
      ([tId, total]) => {
        const tutor = tutors.find((t) => t.id === tId);
        return {
          tutorId: tId,
          name: tutor?.user.name || "غير معروف",
          totalRevenue: total,
        };
      },
    );

    const totalRevenue = revenuePerTutor.reduce(
      (sum, t) => sum + t.totalRevenue,
      0,
    );
    const avgRevenuePerTutor =
      revenuePerTutor.length > 0 ? totalRevenue / revenuePerTutor.length : 0;

    return {
      totalPaidSalaries: totalPaid,
      highestPaidTutors,
      avgSessionsPerTutor: avgSessions,
      avgRevenuePerTutor,
      tutors: tutorSalaries,
      revenuePerTutor,
    };
  },
);

export const payTutor = withResult(
  async (
    academyId: number,
    tutorId: number,
    amount: number,
    salaryMonth: string,
    currencyId: number,
  ) => {
    const costCenter = await db.costCenter.findFirst({
      where: {
        title: "مرتبات المعلمين",
      },
    });
    await db.expense.create({
      data: {
        academyId,
        tutorId,
        amount,
        currencyId,
        status: PaymentStatus.PAID,
        method: 0,
        date: new Date(),
        description: `راتب شهر ${salaryMonth}`,
        costCenterId: costCenter?.id || null,
        salaryMonth,
      },
    });
  },
);

// Optional: get conversion rate for default currency so we know which currency to use when creating expense.
export const getDefaultCurrencyId = withResult(async (academyId: number) => {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  return academy?.defaultCurrencyId || null;
});

export const createExpense = withResult(
  async (
    data: {
      date: string;
      description: string;
      amount: number;
      currencyId: number;
      status: number;
      method?: number;
      costCenterId?: number;
      invoiceUrl?: string;
      notes?: string;
      tutorId?: number;
      salaryMonth?: string;
      academyId: number;
    },
  ) => {
    await db.expense.create({
      data: { ...data, date: dayjs(data.date).toDate() },
    });
  },
);

export const createRevenueFromDashboard = withResult(
  async (
    revenueData: {
      amount: number;
      method: PaymentMethod;
      status: PaymentStatus;
      studentId: number;
      dueDate: string | null;
      recordedBy: null;
      date: string;
      description?: string;
      invoiceUrl?: string;
      notes?: string;
      subscriptionId?: number;
    },
  ) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId || currentUser.role !== Role.Admin)
      return fail("غير مصرح");

    const student = await db.student.findUnique({
      where: { id: revenueData.studentId },
      select: { id: true, currencyId: true },
    });
    if (!student) return fail("لا يوجد طالب بهذا الاسم");

    let planId: number | null = null;
    if (revenueData.subscriptionId) {
      const sub = await db.subscription.findUnique({
        where: { id: revenueData.subscriptionId },
        select: { planId: true },
      });
      planId = sub?.planId ?? null;
    }

    await db.revenue.create({
      data: {
        amount: revenueData.amount,
        currencyId: student.currencyId,
        studentId: student.id,
        planId,
        subscriptionId: revenueData.subscriptionId,
        status: revenueData.status,
        method: revenueData.method,
        recordedBy: currentUser.id,
        academyId: currentUser.academyId!,
        dueDate: revenueData.dueDate
          ? dayjs.utc(revenueData.dueDate).toDate()
          : undefined,
        description: revenueData.description,
        invoiceUrl: revenueData.invoiceUrl,
        notes: revenueData.notes,
      },
    });

    revalidatePath("/ar/dashboard");
  },
);
