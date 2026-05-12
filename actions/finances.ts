"use server";

import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";
import { StudentStatus } from "@/types/student";
import { AttendanceStatus } from "@/types/session";
import { addSessionsFromPayment } from "@/lib/balance";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { Role } from "@/types/user";

// ---------- Helpers ----------
async function getConversionMap(academyId: number) {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  if (!academy?.defaultCurrencyId) throw new Error("Default currency not set");

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

export async function getDashboardAlerts(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
): Promise<DashboardAlerts> {
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

  // Renewal subscriptions – latest active per student
  const latestSubs = await db.subscription.groupBy({
    by: ["studentId"],
    _max: { startDate: true },
  });
  const studentIds = latestSubs.map((s) => s.studentId);
  let upcoming = 0;
  let overdue = 0;
  if (studentIds.length > 0) {
    const maxStarts = latestSubs.map((s) => s._max.startDate!);
    const activeSubs = await db.subscription.findMany({
      where: {
        studentId: { in: studentIds },
        status: SubscriptionStatus.active,
        startDate: { in: maxStarts },
      },
      select: { endDate: true },
    });
    upcoming = activeSubs.filter(
      (s) =>
        s.endDate &&
        dayjs(s.endDate).isAfter(now) &&
        dayjs(s.endDate).isBefore(dayjs(now).add(upcomingDays, "day")),
    ).length;
    overdue = activeSubs.filter(
      (s) => s.endDate && dayjs(s.endDate).isBefore(now),
    ).length;
  }

  return {
    negativeProfit: totalRevenue - totalExpenses < 0,
    overdueRevenueCount: overdueRevenues.length,
    upcomingRenewals: upcoming,
    overdueRenewals: overdue,
  };
}

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

export async function getDashboardKPIs(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
): Promise<DashboardKPIs> {
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
    where: { status: SubscriptionStatus.active },
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
}

// ---------- Revenue & Expenses Over Time ----------
export interface TimeSeriesItem {
  date: string;
  revenue: number;
  expenses: number;
}

export async function getRevenueExpensesOverTime(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
): Promise<TimeSeriesItem[]> {
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
}

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

export async function getSubscriptionRetention(
  academyId: number,
): Promise<RetentionData> {
  const firstSubs = await db.subscription.findMany({
    where: {
      student: {
        academyId,
      },
    },
    select: { studentId: true, startDate: true, status: true },
    orderBy: { startDate: "asc" },
  });

  // Get the earliest start date per student
  const studentFirstStart = new Map<number, dayjs.Dayjs>();
  firstSubs.forEach((s) => {
    const d = dayjs(s.startDate);
    if (
      !studentFirstStart.has(s.studentId) ||
      d.isBefore(studentFirstStart.get(s.studentId)!)
    ) {
      studentFirstStart.set(s.studentId, d);
    }
  });

  // Cohort sizes: count students per cohort month
  const cohortSizes: Record<string, number> = {};
  studentFirstStart.forEach((d) => {
    const key = d.format("YYYY-MM");
    cohortSizes[key] = (cohortSizes[key] || 0) + 1;
  });

  // For each student, check which months after cohort they had an active subscription
  const now = dayjs();
  const matrix: Record<string, number[]> = {};

  for (const [studentId, firstDate] of studentFirstStart) {
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
          studentId,
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
}

// ---------- Plan Efficiency (Revenue & Students per Plan) ----------
export interface PlanEfficiency {
  planId: number;
  planName: string;
  totalRevenue: number;
  activeStudents: number;
  arps?: number; // average revenue per active student
}

export async function getPlanEfficiency(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
): Promise<PlanEfficiency[]> {
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
    where: { planId: { in: planIds }, status: SubscriptionStatus.active },
    _count: { studentId: true },
  });
  const activeMap = new Map<number, number>();
  activeStudentCounts.forEach((g) =>
    activeMap.set(g.planId, g._count.studentId),
  );

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
}

// ----- Currency Conversion Helpers -----
async function getConversion(academyId: number) {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  if (!academy?.defaultCurrencyId) throw new Error("Default currency not set");

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

export async function getRevenueKPIs(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
  filters?: { studentId?: number; method?: number },
): Promise<RevenueKPIs> {
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
        select: {
          tutorId: true,
          tutor: { select: { user: { select: { name: true } } } },
        },
      },
      plan: { select: { id: true, title: true } },
    },
  });

  // Revenue per plan
  const planMap = new Map<number, { name: string; total: number }>();
  // Revenue per tutor (via student.tutorId)
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
    const tutorId = r.student?.tutorId;
    if (tutorId) {
      const name = r.student?.tutor?.user?.name || "";
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
}

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

export async function getOverdueRevenue(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
): Promise<OverdueRevenueItem[]> {
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
      student: { select: { name: true, phone: true } },
      plan: { select: { title: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return revenues.map((r) => ({
    id: r.id,
    amount: r.amount,
    defaultAmount: convert(r.amount, r.currencyId, defaultCurrencyId, rateMap),
    dueDate: dayjs(r.dueDate).format("YYYY-MM-DD"),
    studentName: r.student.name,
    planName: r.plan?.title,
    method: r.method,
    studentPhone: r.student.phone,
  }));
}

// ----- Renewal Subscriptions (latest active per student, upcoming/overdue) -----
export interface RenewalSubscription {
  studentId: number;
  studentName: string;
  studentPhone: string | null;
  planName: string;
  endDate: string;
  id: number;
  daysLeft: number; // positive if upcoming, negative if overdue
  planPrice: number;
}

export async function getRenewalSubscriptions(academyId: number): Promise<{
  upcoming: RenewalSubscription[];
  overdue: RenewalSubscription[];
}> {
  // Get latest active subscription per student
  const latestSubs = await db.subscription.groupBy({
    by: ["studentId"],
    _max: { startDate: true },
    where: {
      student: {
        academyId,
      },
    },
  });
  const studentIds = latestSubs.map((s) => s.studentId);
  if (studentIds.length === 0) return { upcoming: [], overdue: [] };

  const maxStarts = latestSubs.map((s) => s._max.startDate!);
  const subscriptions = await db.subscription.findMany({
    where: {
      studentId: { in: studentIds },
      status: SubscriptionStatus.active,
      startDate: { in: maxStarts },
    },
    include: {
      student: { select: { name: true, phone: true } },
      plan: { select: { title: true, price: true } },
    },
  });

  const now = dayjs();
  const upcoming: RenewalSubscription[] = [];
  const overdue: RenewalSubscription[] = [];

  subscriptions.forEach((sub) => {
    if (!sub.endDate) return;
    const end = dayjs(sub.endDate);
    const daysLeft = end.diff(now, "day");
    const item: RenewalSubscription = {
      id: sub.id,
      studentId: sub.studentId,
      studentName: sub.student.name,
      planName: sub.plan.title,
      endDate: end.format("YYYY-MM-DD"),
      studentPhone: sub.student.phone,
      daysLeft,
      planPrice: sub.plan.price,
    };
    if (daysLeft <= 7 && daysLeft >= 0) {
      upcoming.push(item);
    } else if (daysLeft < 0) {
      overdue.push(item);
    }
  });

  return { upcoming, overdue };
}

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

export async function getRevenueHistory(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
  studentId?: number,
  method?: number,
): Promise<RevenueHistoryItem[]> {
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
      student: { select: { name: true } },
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
    studentName: r.student.name,
    planName: r.plan?.title,
  }));
}

// ----- Mutations -----
export async function markRevenueAsPaid(id: number) {
  await db.revenue.update({
    where: { id },
    data: { status: PaymentStatus.PAID },
  });
}

export async function createRevenueForSubscription(subscriptionId: number) {
  const sub = await db.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      studentId: true,
      planId: true,
      startDate: true,
      endDate: true,
      status: true,
      plan: {
        select: {
          price: true,
          sessionsPerWeek: true,
          currencyId: true,
          billingPeriod: true,
        },
      },
      student: { select: { currencyId: true, academyId: true } },
    },
  });
  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== SubscriptionStatus.active)
    throw new Error("Subscription not active");

  const currencyId = sub.plan.currencyId || sub.student.currencyId;
  const amount = sub.plan.price;
  const billingDays = sub.plan.billingPeriod || 30; // fallback

  // Perform transaction: expire current, create new subscription, record revenue
  await db.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.expired, endDate: new Date() },
    });
    const newSub = await tx.subscription.create({
      data: {
        studentId: sub.studentId,
        planId: sub.planId,
        startDate: new Date(),
        endDate: dayjs().add(billingDays, "day").toDate(),
        status: SubscriptionStatus.active,
      },
    });
    await tx.student.update({
      where: {
        id: sub.studentId,
      },
      data: {
        sessionsBalance: {
          increment: sub.plan.sessionsPerWeek * 4,
        },
      },
    });
    await tx.revenue.create({
      data: {
        amount,
        currencyId,
        academyId: sub.student.academyId,
        studentId: sub.studentId,
        planId: sub.planId,
        subscriptionId: newSub.id,
        status: PaymentStatus.PAID,
        method: 0,
        dueDate: new Date(),
      },
    });
  });
}

export async function updateRevenue(
  id: number,
  data: {
    amount?: number;
    status?: number;
    method?: number;
    dueDate?: string;
    planId?: number;
  },
) {
  const revenue = await db.revenue.findUnique({
    where: { id },
    select: { status: true, subscriptionId: true },
  });
  if (!revenue) throw new Error("Revenue not found");

  // Update the revenue
  await db.revenue.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });

  // If the status changed to PAID and there is a linked subscription, handle subscription lifecycle
  if (
    data.status === PaymentStatus.PAID &&
    revenue.status !== PaymentStatus.PAID &&
    revenue.subscriptionId
  ) {
    // This is similar to a renewal payment
    const sub = await db.subscription.findUnique({
      where: { id: revenue.subscriptionId },
      select: {
        id: true,
        status: true,
        studentId: true,
        planId: true,
        plan: {
          select: {
            price: true,
            academyId: true,
            currencyId: true,
            billingPeriod: true,
          },
        },
      },
    });
    if (sub && sub.status === SubscriptionStatus.active) {
      const billingDays = sub.plan.billingPeriod || 30;
      await db.$transaction([
        db.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.expired, endDate: new Date() },
        }),
        db.subscription.create({
          data: {
            studentId: sub.studentId,
            planId: sub.planId,
            startDate: new Date(),
            endDate: dayjs().add(billingDays, "day").toDate(),
            status: SubscriptionStatus.active,
          },
        }),
      ]);
    }
  }
}

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

export async function getExpensesKPIs(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
): Promise<ExpensesKPIs> {
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
    const cc = e.costCenter || "غير محدد";
    costCenterMap.set(cc, (costCenterMap.get(cc) || 0) + conv);
  });

  // Top expenses (top 5 by amount)
  const topExpenses = expenses.slice(0, 5).map((e) => ({
    id: e.id,
    description: e.description,
    amount: convert(e.amount, e.currencyId, defaultCurrencyId, rateMap),
    costCenter: e.costCenter,
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
}

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

export async function getPendingExpenses(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
  costCenterFilter?: string,
): Promise<PendingExpense[]> {
  const dateRange = getDateRange(period, year, month);
  const { defaultCurrencyId, rateMap } = await getConversion(academyId);

  const where: {
    academyId: number;
    status: PaymentStatus;
    date?: {
      gte: Date;
      lt: Date;
    };
    costCenter?: string;
  } = { academyId, status: PaymentStatus.PENDING };
  if (dateRange) {
    where.date = { gte: dateRange.start, lt: dateRange.end };
  }
  if (costCenterFilter) where.costCenter = costCenterFilter;

  const expenses = await db.expense.findMany({
    where,
    include: {
      tutor: { include: { user: { select: { name: true, phone: true } } } },
    },
    orderBy: { date: "asc" },
  });

  return expenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    defaultAmount: convert(e.amount, e.currencyId, defaultCurrencyId, rateMap),
    date: dayjs(e.date).format("YYYY-MM-DD"),
    costCenter: e.costCenter,
    tutorName: e.tutor?.user.name ?? undefined,
    tutorPhone: e.tutor?.user.phone ?? undefined,
    method: e.method,
  }));
}

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

export async function getExpensesHistory(
  academyId: number,
  period: "all" | "year" | "month",
  year: number,
  month: number,
  costCenterFilter?: string,
): Promise<ExpenseHistoryItem[]> {
  const dateRange = getDateRange(period, year, month);
  const { defaultCurrencyId, rateMap } = await getConversion(academyId);

  const where: {
    academyId: number;
    date?: {
      gte: Date;
      lt: Date;
    };
    costCenter?: string;
  } = { academyId };
  if (dateRange) {
    where.date = { gte: dateRange.start, lt: dateRange.end };
  }
  if (costCenterFilter) where.costCenter = costCenterFilter;

  const expenses = await db.expense.findMany({
    where,
    include: {
      currency: { select: { code: true } },
      tutor: { include: { user: { select: { name: true } } } },
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
    costCenter: e.costCenter,
    tutorName: e.tutor?.user.name ?? undefined,
    tutorId: e.tutorId ?? undefined,
    notes: e.notes,
    invoiceUrl: e.invoiceUrl,
  }));
}

export async function markExpenseAsPaid(id: number) {
  await db.expense.update({
    where: { id },
    data: { status: PaymentStatus.PAID },
  });
}

export async function updateExpense(
  id: number,
  data: {
    amount?: number;
    status?: number;
    method?: number;
    date?: string;
    description?: string;
    costCenter?: string;
    notes?: string;
  },
) {
  await db.expense.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
}

export interface SalaryMonthData {
  totalPaidSalaries: number;
  highestPaidTutors: { tutorId: number; name: string; totalPaid: number }[];
  avgSessionsPerTutor: number;
  avgRevenuePerTutor: number;
  tutors: TutorSalaryInfo[];
  revenuePerTutor: { tutorId: number; name: string; totalRevenue: number }[];
}

export interface TutorSalaryInfo {
  tutorId: number;
  tutorName: string;
  pricePerSession: number;
  completedSessions: number;
  expectedSalary: number;
  paidAmount: number;
  outstanding: number; // expected - paid (min 0)
}

export async function getSalaryData(
  academyId: number,
  year: number,
  month: number,
  tutorId?: number,
): Promise<SalaryMonthData> {
  const { defaultCurrencyId, rateMap } = await getConversion(academyId);

  // Define the month range
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  // 1. Fetch all tutors of the academy (or specific one)
  const tutors = await db.tutor.findMany({
    where: {
      academyId,
      ...(tutorId ? { id: tutorId } : {}),
    },
    include: {
      user: { select: { name: true } },
    },
  });

  // 2. For each tutor, count completed sessions in the month
  const sessionCounts = await db.session.groupBy({
    by: ["tutorId"],
    _count: { id: true },
    where: {
      academyId,
      cancelledBy: null,
      attendance: {
        tutorAttendanceStatus: {
          in: [AttendanceStatus.ATTENDED, AttendanceStatus.LATE],
        },
      },
      startTime: { gte: startOfMonth, lt: endOfMonth },
      tutorId: tutorId ? tutorId : { in: tutors.map((t) => t.id) },
    },
  });
  const sessionCountMap = new Map<number, number>();
  sessionCounts.forEach((g) => sessionCountMap.set(g.tutorId, g._count.id));

  // 3. For each tutor, sum PAID expenses in that month (salary expenses)
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

  // 4. Compute expected salary per tutor = completedSessions * pricePerSession
  const tutorSalaries: TutorSalaryInfo[] = tutors.map((t) => {
    const completed = sessionCountMap.get(t.id) || 0;
    const expected = completed * t.pricePerSession;
    const paid = paidAmountMap.get(t.id) || 0;
    const outstanding = Math.max(expected - paid, 0);
    return {
      tutorId: t.id,
      tutorName: t.user.name || "غير معروف",
      pricePerSession: t.pricePerSession,
      completedSessions: completed,
      expectedSalary: expected,
      paidAmount: paid,
      outstanding,
    };
  });

  // 5. Total paid salaries in the month (sum of all paid amount for tutors)
  const totalPaid = Array.from(paidAmountMap.values()).reduce(
    (a, b) => a + b,
    0,
  );

  // 6. Highest paid tutors (top 5)
  const highestPaidTutors = tutorSalaries
    .filter((ts) => ts.paidAmount > 0)
    .sort((a, b) => b.paidAmount - a.paidAmount)
    .slice(0, 5)
    .map((ts) => ({
      tutorId: ts.tutorId,
      name: ts.tutorName,
      totalPaid: ts.paidAmount,
    }));

  // 7. Avg sessions per tutor (of those who have at least one session)
  const tutorsWithSessions = tutorSalaries.filter(
    (ts) => ts.completedSessions > 0,
  );
  const avgSessions =
    tutorsWithSessions.length > 0
      ? tutorsWithSessions.reduce((sum, ts) => sum + ts.completedSessions, 0) /
        tutorsWithSessions.length
      : 0;

  // 8. Avg revenue per tutor (from revenue tab logic, but scoped to month)
  const revenues = await db.revenue.findMany({
    where: {
      academyId,
      status: PaymentStatus.PAID,
      dueDate: { gte: startOfMonth, lt: endOfMonth },
      student: {
        tutorId: tutorId ? tutorId : { in: tutors.map((t) => t.id) },
      },
    },
    select: {
      amount: true,
      currencyId: true,
      student: { select: { tutorId: true } },
    },
  });

  // Group revenue by tutor
  const revenueMap = new Map<number, number>();
  revenues.forEach((r) => {
    const tutorId = r.student.tutorId;
    if (!tutorId) return;
    const conv = convert(r.amount, r.currencyId, defaultCurrencyId, rateMap);
    revenueMap.set(tutorId, (revenueMap.get(tutorId) || 0) + conv);
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

  const tutorsWithRevenue = revenuePerTutor.length;
  const totalRevenue = revenuePerTutor.reduce(
    (sum, t) => sum + t.totalRevenue,
    0,
  );
  const avgRevenuePerTutor =
    tutorsWithRevenue > 0 ? totalRevenue / tutorsWithRevenue : 0;

  return {
    totalPaidSalaries: totalPaid,
    highestPaidTutors,
    avgSessionsPerTutor: avgSessions,
    avgRevenuePerTutor,
    tutors: tutorSalaries,
    revenuePerTutor,
  };
}

// ----- Mutation: Pay Tutor (create expense for outstanding salary) -----
export async function payTutor(
  academyId: number,
  tutorId: number,
  amount: number,
  salaryMonth: string, // e.g., "2025-05"
  currencyId: number,
) {
  // Create an expense record with status PAID
  await db.expense.create({
    data: {
      academyId,
      tutorId,
      amount,
      currencyId,
      status: PaymentStatus.PAID,
      method: 0, // default method
      date: new Date(),
      description: `راتب شهر ${salaryMonth}`,
      costCenter: "رواتب المعلمين",
      salaryMonth,
    },
  });
}

// Optional: get conversion rate for default currency so we know which currency to use when creating expense.
export async function getDefaultCurrencyId(academyId: number) {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  return academy?.defaultCurrencyId || null;
}

export async function createExpense(data: {
  date: string;
  description: string;
  amount: number;
  currencyId: number;
  status: number;
  method?: number;
  costCenter?: string;
  invoiceUrl?: string;
  notes?: string;
  tutorId?: number;
  salaryMonth?: string;
  academyId: number;
}) {
  await db.expense.create({
    data: { ...data, date: dayjs(data.date).toDate() },
  });
}

export async function createRevenueFromDashboard(revenueData: {
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  studentId: number;
  dueDate: string | null;
  recordedBy: null;
  academyId: number;
  date: string;
  description?: string;
  invoiceUrl?: string;
  notes?: string;
}) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.Admin) throw new Error("غير مصرح");

  const student = await db.student.findUnique({
    where: { id: revenueData.studentId },
  });
  if (!student) throw new Error("لا يوجد طالب بهذا الاسم");

  const plan = student.planId
    ? await db.plan.findUnique({ where: { id: student.planId } })
    : null;

  await db.$transaction(async (tx) => {
    const payment = await tx.revenue.create({
      data: {
        ...revenueData,
        currencyId: student.currencyId,
        planId: student.planId,
        recordedBy: payload.id,
        subscriptionId: student.currentSubscriptionId,
        dueDate: revenueData.dueDate
          ? dayjs.utc(revenueData.date).toDate()
          : undefined,
      },
    });

    if (student.currentSubscriptionId && plan) {
      await tx.subscription.update({
        where: { id: student.currentSubscriptionId },
        data: {
          status: SubscriptionStatus.active,
          endDate: dayjs().add(1, "month").toDate(),
          startDate: dayjs().toDate(),
        },
      });
    }

    if (revenueData.status === PaymentStatus.PAID) {
      await addSessionsFromPayment(payment.id, tx);
    }
  });

  revalidatePath("/ar/dashboard");
}
