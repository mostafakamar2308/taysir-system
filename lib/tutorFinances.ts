import dayjs from "@/lib/dayjs";
import { PaymentStatus } from "@/types/payment";
import { SessionStatus } from "@/types/session";
import type {
  TutorFinancialSummary,
  TutorFinancesInput,
  TutorGroupBreakdownRow,
  TutorPaymentHistoryItem,
  TutorPeriod,
  TutorPeriodBreakdownRow,
  TutorSessionEarnings,
} from "@/types/tutorFinances";

export { getTutorPeriodRange } from "./tutorPeriod";

// ---------- Pure helpers ----------

function convertAmount(
  amount: number,
  currencyId: number,
  defaultCurrencyId: number,
  rateMap: Record<number, number>,
): number {
  if (currencyId === defaultCurrencyId) return amount;
  const rate = rateMap[currencyId];
  return rate ? amount * rate : amount;
}

// A session is payable when the tutor actually delivered it: not cancelled
// and already started. Trial sessions count (academy pays the tutor for them).
export function isPayableSession(
  s: { cancelledBy: number | null; startTime: string },
  now: Date,
): boolean {
  if (s.cancelledBy != null) return false;
  return dayjs.utc(s.startTime).isBefore(dayjs.utc(now));
}

export function sessionStatusOf(
  s: { cancelledBy: number | null; startTime: string },
  now: Date,
): SessionStatus {
  if (s.cancelledBy != null) return SessionStatus.CANCELLED;
  if (dayjs.utc(s.startTime).isBefore(dayjs.utc(now))) return SessionStatus.COMPLETED;
  return SessionStatus.SCHEDULED;
}

// tutorRate is the hourly rate frozen at scheduling time.
function earningsOf(s: { tutorRate: number; durationMinutes: number }): number {
  return (s.tutorRate * s.durationMinutes) / 60;
}

function monthKey(date: string | Date): string {
  return dayjs.utc(date).format("YYYY-MM");
}

// ---------- Main calculation ----------

export function computeTutorFinancialSummary(
  input: TutorFinancesInput,
  period: TutorPeriod,
): TutorFinancialSummary {
  const now = input.now ?? new Date();
  const defaultCurrency = input.defaultCurrency;
  const rateMap = input.rateMap;

  const conv = (amount: number, currencyId: number) =>
    convertAmount(amount, currencyId, defaultCurrency.id, rateMap);

  const from = dayjs.utc(period.from).startOf("day");
  const to = dayjs.utc(period.to).endOf("day");

  const inPeriod = (t: dayjs.Dayjs) => !t.isBefore(from) && !t.isAfter(to);

  // Paid amounts per month (Expense rows, PAID only, tied to salaryMonth).
  const paidByMonth = new Map<string, number>();
  for (const p of input.payments) {
    if (p.status !== PaymentStatus.PAID || !p.month) continue;
    paidByMonth.set(p.month, (paidByMonth.get(p.month) ?? 0) + conv(p.amount, p.currencyId));
  }

  // Earnings per month across ALL sessions (for byPeriod + totalOutstanding).
  const earnedByMonth = new Map<string, number>();
  const countByMonth = new Map<string, number>();
  for (const s of input.sessions) {
    if (!isPayableSession(s, now)) continue;
    const month = monthKey(s.startTime);
    earnedByMonth.set(month, (earnedByMonth.get(month) ?? 0) + earningsOf(s));
    countByMonth.set(month, (countByMonth.get(month) ?? 0) + 1);
  }

  // Period totals from payable sessions dated inside the period.
  const periodSessions = input.sessions.filter((s) => inPeriod(dayjs.utc(s.startTime)));
  const payableInPeriod = periodSessions.filter((s) => isPayableSession(s, now));
  const earned = payableInPeriod.reduce((sum, s) => sum + earningsOf(s), 0);

  // Months covered by the selected period.
  const periodMonths = new Set<string>();
  let cursor = dayjs.utc(from).startOf("month");
  const lastMonth = dayjs.utc(to).startOf("month");
  while (cursor.isBefore(lastMonth) || cursor.isSame(lastMonth, "month")) {
    periodMonths.add(cursor.format("YYYY-MM"));
    cursor = cursor.add(1, "month");
  }

  const paid = [...periodMonths].reduce(
    (sum, month) => sum + (paidByMonth.get(month) ?? 0),
    0,
  );
  const outstanding = Math.max(0, earned - paid);

  // By-period across all months that have earnings or payments.
  const allMonths = new Set<string>([...earnedByMonth.keys(), ...paidByMonth.keys()]);
  const byPeriod: TutorPeriodBreakdownRow[] = [...allMonths]
    .sort()
    .map((month) => {
      const earnedM = earnedByMonth.get(month) ?? 0;
      const paidM = paidByMonth.get(month) ?? 0;
      return {
        month,
        earned: earnedM,
        paid: paidM,
        outstanding: Math.max(0, earnedM - paidM),
        sessionCount: countByMonth.get(month) ?? 0,
      };
    });

  const totalOutstanding = byPeriod.reduce((sum, r) => sum + r.outstanding, 0);

  // Earnings breakdown grouped by (group, rate) — never merge different rates.
  const groupMap = new Map<string, TutorGroupBreakdownRow>();
  for (const s of payableInPeriod) {
    const key = `${s.groupId}:${s.tutorRate}`;
    const row =
      groupMap.get(key) ?? {
        groupId: s.groupId,
        groupTitle: s.groupTitle,
        rate: s.tutorRate,
        sessionCount: 0,
        totalMinutes: 0,
        earnings: 0,
      };
    row.sessionCount += 1;
    row.totalMinutes += s.durationMinutes;
    row.earnings += earningsOf(s);
    groupMap.set(key, row);
  }
  const byGroup = [...groupMap.values()].sort((a, b) => b.earnings - a.earnings);

  // Session rows (all sessions in the period, payable or not).
  const sessions: TutorSessionEarnings[] = periodSessions
    .map((s) => {
      const month = monthKey(s.startTime);
      const payable = isPayableSession(s, now);
      const monthPaid = paidByMonth.get(month) ?? 0;
      const monthEarned = earnedByMonth.get(month) ?? 0;
      return {
        id: s.id,
        groupId: s.groupId,
        groupTitle: s.groupTitle,
        startTime: s.startTime,
        durationMinutes: s.durationMinutes,
        tutorRate: s.tutorRate,
        isTrial: s.isTrial,
        status: sessionStatusOf(s, now),
        students: s.students,
        earnings: payable ? earningsOf(s) : 0,
        payable,
        paid: payable && monthPaid >= monthEarned && monthEarned > 0,
        month,
      };
    })
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  const paymentHistory: TutorPaymentHistoryItem[] = [...input.payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) => ({
      id: p.id,
      amount: p.amount,
      amountInDefault: conv(p.amount, p.currencyId),
      currencyCode: p.currencyCode,
      currencySymbol: p.currencySymbol,
      month: p.month,
      method: p.method,
      status: p.status,
      date: p.date,
      notes: p.notes,
      recordedByName: p.recordedByName,
    }));

  return {
    tutorId: input.tutorId,
    defaultCurrency,
    period: {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      preset: period.preset,
    },
    earned,
    paid,
    outstanding,
    payableSessionCount: payableInPeriod.length,
    byGroup,
    byPeriod,
    sessions,
    paymentHistory,
    totalOutstanding,
  };
}
