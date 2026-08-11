import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";
import { countSessionsUsed, SessionInput } from "@/lib/studentFinances";

// Builds a weekly WhatsApp summary for the academy admin covering overdue
// renewals, renewals due within the next week, students who ran out of
// sessions, and the total amount outstanding from active subscriptions.
// Returns null when there is nothing actionable to report.
export async function buildAdminPaymentsSummary(
  academyId: number,
): Promise<string | null> {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    include: {
      defaultCurrency: { select: { id: true, symbol: true } },
    },
  });
  if (!academy?.defaultCurrency) return null;

  const defaultCurrencyId = academy.defaultCurrency.id;
  const symbol = academy.defaultCurrency.symbol;
  const rates = await db.academyCurrencyRate.findMany({ where: { academyId } });
  const rateMap = new Map<number, number>();
  rates.forEach((r) => rateMap.set(r.currencyId, r.rate));
  const conv = (amount: number, currencyId: number) => {
    if (currencyId === defaultCurrencyId) return amount;
    const rate = rateMap.get(currencyId);
    return rate ? amount * rate : amount;
  };

  const subs = await db.subscription.findMany({
    where: {
      status: SubscriptionStatus.active,
      groupStudent: { group: { academyId } },
    },
    include: {
      groupStudent: {
        select: {
          student: {
            select: { id: true, user: { select: { name: true } } },
          },
          group: { select: { id: true, title: true } },
        },
      },
      currency: { select: { symbol: true } },
    },
  });

  if (subs.length === 0) return null;

  const studentIds = Array.from(
    new Set(subs.map((s) => s.groupStudent.student.id)),
  );
  const participants = await db.sessionParticipant.findMany({
    where: { studentId: { in: studentIds } },
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
  });
  const participantsByStudent = new Map<number, SessionInput[]>();
  for (const p of participants) {
    const list = participantsByStudent.get(p.studentId) ?? [];
    list.push({ price: p.price, session: p.session });
    participantsByStudent.set(p.studentId, list);
  }

  const paidRevenues = await db.revenue.findMany({
    where: {
      academyId,
      status: PaymentStatus.PAID,
      subscriptionId: { in: subs.map((s) => s.id) },
    },
    select: { subscriptionId: true, amount: true, currencyId: true },
  });
  const paidBySub = new Map<number, number>();
  for (const r of paidRevenues) {
    if (r.subscriptionId == null) continue;
    paidBySub.set(
      r.subscriptionId,
      (paidBySub.get(r.subscriptionId) ?? 0) +
        conv(r.amount, r.currencyId),
    );
  }

  const now = new Date();
  const fmt = (n: number) =>
    n.toLocaleString("ar-EG", { maximumFractionDigits: 2 });

  const overdueNames: string[] = [];
  const upcomingLines: string[] = [];
  const exhaustedLines: string[] = [];
  let overdueAmount = 0;
  let totalOutstanding = 0;

  for (const sub of subs) {
    const studentName = sub.groupStudent.student.user.name ?? "طالب";
    const groupTitle = sub.groupStudent.group.title;
    const groupId = sub.groupStudent.group.id;
    const studentId = sub.groupStudent.student.id;
    const myParticipants = participantsByStudent.get(studentId) ?? [];

    const priceInDefault = conv(sub.price, sub.currencyId);
    const used = countSessionsUsed(
      sub.startDate,
      sub.endDate,
      groupId,
      myParticipants,
      now,
    );
    const paid = paidBySub.get(sub.id) ?? 0;

    let extraInDefault = 0;
    if (sub.sessionCount != null && used > sub.sessionCount) {
      const windowSessions = myParticipants
        .filter((p) => {
          const s = p.session;
          if (s.groupId !== groupId || s.cancelledBy != null || s.isTrial)
            return false;
          const t = dayjs.utc(s.startTime).startOf("day");
          if (t.isBefore(dayjs.utc(sub.startDate).startOf("day"))) return false;
          if (sub.endDate && t.isAfter(dayjs.utc(sub.endDate).startOf("day")))
            return false;
          if (t.isAfter(dayjs.utc(now).startOf("day"))) return false;
          return true;
        })
        .sort(
          (a, b) =>
            a.session.startTime.getTime() - b.session.startTime.getTime(),
        );
      const overCount = used - sub.sessionCount;
      const extraCost = windowSessions
        .slice(-overCount)
        .reduce((sum, p) => sum + p.price, 0);
      extraInDefault = conv(extraCost, sub.currencyId);
    }

    const owed = Math.max(0, priceInDefault + extraInDefault - paid);
    totalOutstanding += owed;

    if (sub.sessionCount != null && sub.sessionCount - used <= 0) {
      exhaustedLines.push(`${studentName} — ${groupTitle}`);
    }

    const billing = sub.nextBillingDate ?? sub.endDate;
    if (billing) {
      const daysLeft = dayjs(billing).startOf("day").diff(
        dayjs(now).startOf("day"),
        "day",
      );
      if (daysLeft < 0) {
        overdueNames.push(studentName);
        overdueAmount += owed;
      } else if (daysLeft <= 7) {
        const when =
          daysLeft === 0 ? "اليوم" : daysLeft === 1 ? "غدًا" : `بعد ${daysLeft} أيام`;
        upcomingLines.push(`${studentName} — ${groupTitle} (${when})`);
      }
    }
  }

  if (
    overdueNames.length === 0 &&
    upcomingLines.length === 0 &&
    exhaustedLines.length === 0
  ) {
    return null;
  }

  const lines: string[] = ["تقرير المدفوعات الأسبوعي للأكاديمية"];

  if (overdueNames.length > 0) {
    lines.push("•");
    lines.push(`متأخرون عن السداد (${overdueNames.length}):`);
    lines.push(`  المبلغ المتأخر: ${fmt(overdueAmount)} ${symbol}`);
    lines.push(`  الطلاب: ${overdueNames.slice(0, 8).join("، ")}`);
    if (overdueNames.length > 8) lines.push("  ...وغيرهم");
  }

  if (upcomingLines.length > 0) {
    lines.push("•");
    lines.push(`تجديدات مستحقة خلال 7 أيام (${upcomingLines.length}):`);
    upcomingLines.slice(0, 8).forEach((l) => lines.push(`  • ${l}`));
    if (upcomingLines.length > 8) lines.push("  ...وغيرهم");
  }

  if (exhaustedLines.length > 0) {
    lines.push("•");
    lines.push(`طلاب نفدت حصصهم (${exhaustedLines.length}):`);
    exhaustedLines.slice(0, 8).forEach((l) => lines.push(`  • ${l}`));
    if (exhaustedLines.length > 8) lines.push("  ...وغيرهم");
  }

  lines.push("•");
  lines.push(`إجمالي المستحق من الاشتراكات النشطة: ${fmt(totalOutstanding)} ${symbol}`);
  lines.push("يرجى مراجعة المدفوعات واتخاذ اللازم.");

  return lines.join("\n");
}
