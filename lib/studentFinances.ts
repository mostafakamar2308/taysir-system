import dayjs from "@/lib/dayjs";
import { PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";
import {
  FinancialWarning,
  PaymentHistoryItem,
  StudentFinancialSummary,
  SubscriptionCycleState,
  SubscriptionFinancial,
} from "@/types/studentFinances";

// ---------- Input shapes (built by the server action) ----------

export interface SubInput {
  id: number;
  groupStudentId: number;
  groupId: number;
  groupTitle: string;
  planId: number | null;
  planTitle: string | null;
  price: number;
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  sessionCount: number | null;
  billingCycle: number;
  startDate: Date;
  endDate: Date | null;
  nextBillingDate: Date | null;
  status: number;
  membershipActive: boolean;
}

export interface SessionInput {
  session: {
    startTime: Date;
    groupId: number;
    cancelledBy: number | null;
    isTrial: boolean;
  };
}

export interface RevenueInput {
  id: number;
  amount: number;
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  status: number;
  method: number | null;
  dueDate: Date;
  description: string | null;
  subscriptionId: number | null;
  subscriptionLabel: string | null;
}

export interface StudentFinancesInput {
  studentId: number;
  billingDateOverride: Date | null;
  defaultCurrency: { id: number; code: string; symbol: string };
  rateMap: Map<number, number>;
  now?: Date;
  subscriptions: SubInput[];
  memberships: {
    groupStudentId: number;
    groupId: number;
    groupTitle: string;
    membershipActive: boolean;
  }[];
  sessionParticipants: SessionInput[];
  revenues: RevenueInput[];
}

// ---------- Pure helpers ----------

function convertAmount(
  amount: number,
  currencyId: number,
  defaultCurrencyId: number,
  rateMap: Map<number, number>,
): number {
  if (currencyId === defaultCurrencyId) return amount;
  const rate = rateMap.get(currencyId);
  return rate ? amount * rate : amount;
}

function startOfDay(d: Date | string): dayjs.Dayjs {
  return dayjs.utc(d).startOf("day");
}

function computeCycleState(
  billing: Date | null,
  price: number,
  paid: number,
  now: Date,
): SubscriptionCycleState {
  if (price > 0 && paid >= price - 0.001) return "paid";
  if (!billing) return "upcoming";
  const today = startOfDay(now);
  const bill = startOfDay(billing);
  if (bill.isBefore(today)) return "overdue";
  if (bill.isSame(today)) return "due";
  return "upcoming";
}

// ---------- Session usage ----------

// Counts sessions actually used against a subscription window (non-cancelled,
// non-trial, already held, inside the subscription's date range).
export function countSessionsUsed(
  startDate: Date,
  endDate: Date | null,
  groupId: number,
  participants: SessionInput[],
  now: Date = new Date(),
): number {
  let used = 0;
  for (const p of participants) {
    const s = p.session;
    if (s.groupId !== groupId || s.cancelledBy != null || s.isTrial) continue;
    const t = startOfDay(s.startTime);
    if (t.isBefore(startOfDay(startDate))) continue;
    if (endDate && t.isAfter(startOfDay(endDate))) continue;
    if (t.isAfter(startOfDay(now))) continue;
    used += 1;
  }
  return used;
}

// ---------- Main calculation ----------

export function computeStudentFinancialSummary(
  input: StudentFinancesInput,
): StudentFinancialSummary {
  const now = input.now ?? new Date();
  const defaultCurrency = input.defaultCurrency;
  const rateMap = input.rateMap;

  const conv = (amount: number, currencyId: number) =>
    convertAmount(amount, currencyId, defaultCurrency.id, rateMap);

  // Sessions actually used per subscription window (non-cancelled, non-trial,
  // already held, inside the subscription's date range).
  const sessionsUsedFor = (sub: SubInput) =>
    countSessionsUsed(sub.startDate, sub.endDate, sub.groupId, input.sessionParticipants, now);

  // Paid amount per subscription (PAID revenues linked to that row).
  const paidBySub = new Map<number, number>();
  for (const r of input.revenues) {
    if (r.status !== PaymentStatus.PAID || r.subscriptionId == null) continue;
    paidBySub.set(
      r.subscriptionId,
      (paidBySub.get(r.subscriptionId) ?? 0) + conv(r.amount, r.currencyId),
    );
  }

  const isRelevant = (sub: SubInput) =>
    sub.status === SubscriptionStatus.active && sub.membershipActive;

  const subscriptions: SubscriptionFinancial[] = input.subscriptions.map((sub) => {
    const sessionCount = sub.sessionCount ?? null;
    const sessionsUsed = sessionsUsedFor(sub);
    const sessionsRemaining =
      sessionCount == null ? null : Math.max(0, sessionCount - sessionsUsed);
    const paidThisCycle = paidBySub.get(sub.id) ?? 0;
    const priceInDefault = conv(sub.price, sub.currencyId);
    const outstanding = Math.max(0, priceInDefault - paidThisCycle);
    const billing = sub.nextBillingDate ?? sub.endDate;
    const cycleState = computeCycleState(billing, priceInDefault, paidThisCycle, now);
    const hasSessionWarning =
      isRelevant(sub) && sessionCount != null && sessionsRemaining === 0;

    return {
      id: sub.id,
      groupStudentId: sub.groupStudentId,
      groupId: sub.groupId,
      groupTitle: sub.groupTitle,
      planId: sub.planId,
      planTitle: sub.planTitle,
      price: sub.price,
      currencyCode: sub.currencyCode,
      currencySymbol: sub.currencySymbol,
      sessionCount,
      sessionsUsed,
      sessionsRemaining,
      billingCycle: sub.billingCycle,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate?.toISOString() ?? null,
      nextBillingDate: sub.nextBillingDate?.toISOString() ?? null,
      status: sub.status as SubscriptionStatus,
      membershipActive: sub.membershipActive,
      paidThisCycle,
      outstanding,
      cycleState,
      hasSessionWarning,
    };
  });

  const relevant = input.subscriptions.filter(isRelevant);

  const totalDue = relevant.reduce((sum, s) => sum + conv(s.price, s.currencyId), 0);
  const totalPaidCycle = relevant.reduce(
    (sum, s) => sum + (paidBySub.get(s.id) ?? 0),
    0,
  );
  const outstanding = Math.max(0, totalDue - totalPaidCycle);
  const overdue = relevant.reduce((sum, s) => {
    const billing = s.nextBillingDate ?? s.endDate;
    if (!billing) return sum;
    const price = conv(s.price, s.currencyId);
    const paid = paidBySub.get(s.id) ?? 0;
    if (price - paid <= 0.001) return sum;
    const bill = startOfDay(billing);
    if (bill.isBefore(startOfDay(now))) {
      return sum + Math.max(0, price - paid);
    }
    return sum;
  }, 0);

  const totalPaidHistorical = input.revenues.reduce(
    (sum, r) => (r.status === PaymentStatus.PAID ? sum + conv(r.amount, r.currencyId) : sum),
    0,
  );

  // Billing date: custom override wins; otherwise earliest relevant active
  // subscription's billing date (nextBillingDate ?? endDate ?? startDate).
  let billingDate: string | null = null;
  let derivedBillingDate: string | null = null;
  let billingDateSource: "custom" | "derived" = "derived";
  let earliest: Date | null = null;
  for (const sub of relevant) {
    const candidate = sub.nextBillingDate ?? sub.endDate ?? sub.startDate;
    if (!candidate) continue;
    if (!earliest || candidate.getTime() < earliest.getTime()) earliest = candidate;
  }
  if (earliest) derivedBillingDate = earliest.toISOString();
  if (input.billingDateOverride) {
    billingDate = input.billingDateOverride.toISOString();
    billingDateSource = "custom";
  } else {
    billingDate = derivedBillingDate;
    billingDateSource = "derived";
  }

  // Payment history – actual Revenue records, newest first.
  const paymentHistory: PaymentHistoryItem[] = [...input.revenues]
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
    .map((r) => ({
      id: r.id,
      amount: r.amount,
      amountInDefault: conv(r.amount, r.currencyId),
      currencyCode: r.currencyCode,
      currencySymbol: r.currencySymbol,
      status: r.status,
      method: r.method,
      date: r.dueDate.toISOString(),
      dueDate: r.dueDate.toISOString(),
      description: r.description,
      subscriptionId: r.subscriptionId,
      subscriptionLabel: r.subscriptionLabel,
    }));

  // Warnings
  const warnings: FinancialWarning[] = [];
  if (relevant.length === 0) {
    warnings.push({
      type: "info",
      message: "لا يوجد اشتراكات نشطة لهذا الطالب",
    });
  }
  const relevantFinancials = subscriptions.filter((s) => s.status === SubscriptionStatus.active && s.membershipActive);
  for (const sub of relevantFinancials) {
    if (sub.cycleState === "overdue") {
      warnings.push({
        type: "danger",
        message: `متأخر في سداد اشتراك ${sub.groupTitle}`,
      });
    }
    if (sub.hasSessionWarning) {
      warnings.push({
        type: "warning",
        message: `نفدت حصص اشتراك ${sub.groupTitle} بينما الاشتراك لا يزال نشطًا`,
      });
    }
  }

  return {
    studentId: input.studentId,
    defaultCurrency,
    billingDate,
    derivedBillingDate,
    billingDateSource,
    totalDue,
    totalPaidCycle,
    outstanding,
    overdue,
    totalPaidHistorical,
    activeSubscriptionCount: relevant.length,
    inactiveSubscriptionCount: input.subscriptions.length - relevant.length,
    subscriptions,
    groups: input.memberships.map((m) => ({
      groupStudentId: m.groupStudentId,
      groupId: m.groupId,
      groupTitle: m.groupTitle,
      membershipActive: m.membershipActive,
    })),
    paymentHistory,
    warnings,
  };
}
