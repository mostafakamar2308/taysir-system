import db from "@/lib/prisma";
import { PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";
import type { SubscriptionCycleState } from "@/types/studentFinances";
import {
  computeSubscriptionFinance,
  SessionInput,
  SubInput,
} from "@/lib/studentFinances";

// One canonical per-subscription row, computed by the same math as the
// student profile finances tab (computeStudentFinancialSummary).
export interface AcademyStudentFinancialRow {
  subId: number;
  studentId: number;
  studentName: string;
  phone: string | null;
  groupId: number;
  groupTitle: string;
  planTitle: string | null;
  priceInDefault: number;
  extraCostInDefault: number;
  paidThisCycle: number;
  outstanding: number;
  overdueAmount: number;
  billingDate: string | null;
  daysLeft: number | null;
  sessionsUsed: number;
  sessionCount: number | null;
  sessionsRemaining: number | null;
  sessionsExhausted: boolean;
  cycleState: SubscriptionCycleState;
}

// Loads every relevant (active subscription + active membership) row of an
// academy in a handful of queries and runs it through the canonical engine.
// No auth checks here – wrap in an action for UI callers; cron calls it
// directly.
export async function loadAcademyStudentFinancialRows(
  academyId: number,
): Promise<AcademyStudentFinancialRow[]> {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  if (!academy?.defaultCurrencyId) {
    throw new Error("العملة الافتراضية غير محددة");
  }
  const defaultCurrencyId = academy.defaultCurrencyId;

  const rates = await db.academyCurrencyRate.findMany({ where: { academyId } });
  const rateMap = new Map<number, number>();
  rates.forEach((r) => rateMap.set(r.currencyId, r.rate));

  const memberships = await db.groupStudent.findMany({
    where: { group: { academyId } },
    select: {
      active: true,
      student: {
        select: { id: true, user: { select: { name: true, phone: true } } },
      },
      group: { select: { id: true, title: true, active: true } },
      subscriptions: {
        where: { status: SubscriptionStatus.active },
        select: {
          id: true,
          planId: true,
          price: true,
          currencyId: true,
          sessionCount: true,
          billingCycle: true,
          startDate: true,
          endDate: true,
          nextBillingDate: true,
          plan: { select: { title: true } },
        },
      },
    },
  });

  const subInputs: { sub: SubInput; studentId: number }[] = [];
  const studentIds = new Set<number>();
  for (const m of memberships) {
    const membershipActive = m.active && m.group.active;
    if (!membershipActive) continue;
    for (const sub of m.subscriptions) {
      studentIds.add(m.student.id);
      subInputs.push({
        studentId: m.student.id,
        sub: {
          id: sub.id,
          groupStudentId: -1,
          groupId: m.group.id,
          groupTitle: m.group.title,
          planId: sub.planId,
          planTitle: sub.plan?.title ?? null,
          price: sub.price,
          currencyId: sub.currencyId,
          currencyCode: "",
          currencySymbol: "",
          sessionCount: sub.sessionCount,
          billingCycle: sub.billingCycle,
          startDate: sub.startDate,
          endDate: sub.endDate,
          nextBillingDate: sub.nextBillingDate,
          status: SubscriptionStatus.active,
          membershipActive,
        },
      });
    }
  }
  if (subInputs.length === 0) return [];

  const [participants, paidRevenues] = await Promise.all([
    db.sessionParticipant.findMany({
      where: { studentId: { in: Array.from(studentIds) } },
      select: {
        studentId: true,
        price: true,
        session: {
          select: {
            startTime: true,
            groupId: true,
            cancelledBy: true,
            isTrial: true,
          },
        },
      },
    }),
    db.revenue.findMany({
      where: {
        academyId,
        status: PaymentStatus.PAID,
        subscriptionId: { in: subInputs.map((s) => s.sub.id) },
      },
      select: { subscriptionId: true, amount: true, currencyId: true },
    }),
  ]);

  const participantsByStudent = new Map<number, SessionInput[]>();
  for (const p of participants) {
    const list = participantsByStudent.get(p.studentId) ?? [];
    list.push({ price: p.price, session: p.session });
    participantsByStudent.set(p.studentId, list);
  }

  const studentById = new Map<number, { name: string; phone: string | null }>();
  for (const m of memberships) {
    studentById.set(m.student.id, {
      name: m.student.user.name ?? "",
      phone: m.student.user.phone ?? null,
    });
  }

  // Paid amount per subscription (PAID revenues linked to that row), converted
  // to the academy's default currency.
  const paidBySub = new Map<number, number>();
  for (const r of paidRevenues) {
    if (r.subscriptionId == null) continue;
    if (r.currencyId === defaultCurrencyId) {
      paidBySub.set(r.subscriptionId, (paidBySub.get(r.subscriptionId) ?? 0) + r.amount);
      continue;
    }
    const rate = rateMap.get(r.currencyId);
    const amount = rate ? r.amount * rate : r.amount;
    paidBySub.set(r.subscriptionId, (paidBySub.get(r.subscriptionId) ?? 0) + amount);
  }

  const now = new Date();
  const rows: AcademyStudentFinancialRow[] = [];
  for (const { sub, studentId } of subInputs) {
    const student = studentById.get(studentId);
    if (!student) continue;
    const comp = computeSubscriptionFinance(
      sub,
      participantsByStudent.get(studentId) ?? [],
      paidBySub,
      defaultCurrencyId,
      rateMap,
      now,
    );
    rows.push({
      subId: sub.id,
      studentId,
      studentName: student.name,
      phone: student.phone,
      groupId: sub.groupId,
      groupTitle: sub.groupTitle,
      planTitle: sub.planTitle,
      priceInDefault: comp.priceInDefault,
      extraCostInDefault: comp.extraInDefault,
      paidThisCycle: comp.paidThisCycle,
      outstanding: comp.outstanding,
      overdueAmount: comp.overdueAmount,
      billingDate: comp.billing ? comp.billing.toISOString() : null,
      daysLeft: comp.daysLeft,
      sessionsUsed: comp.sessionsUsed,
      sessionCount: sub.sessionCount ?? null,
      sessionsRemaining: comp.sessionsRemaining,
      sessionsExhausted: comp.hasSessionWarning,
      cycleState: comp.cycleState,
    });
  }
  return rows;
}
