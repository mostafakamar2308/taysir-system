import db from "@/lib/prisma";
import {
  loadAcademyStudentFinancialRows,
  AcademyStudentFinancialRow,
} from "@/lib/studentFinancesLoader";

// Builds a weekly WhatsApp summary for the academy admin covering overdue
// renewals, renewals due within the next week, students who ran out of
// sessions, and the total amount outstanding from active subscriptions.
// Uses the canonical per-subscription engine rows so the numbers always match
// the dashboard reconciliation and student profile finances tabs.
// Returns null when there is nothing actionable to report.
export async function buildAdminPaymentsSummary(
  academyId: number,
): Promise<string | null> {
  const [academy, rows] = await Promise.all([
    db.academy.findUnique({
      where: { id: academyId },
      select: { defaultCurrency: { select: { symbol: true } } },
    }),
    loadAcademyStudentFinancialRows(academyId).catch(
      (): AcademyStudentFinancialRow[] => [],
    ),
  ]);
  const symbol = academy?.defaultCurrency?.symbol;
  if (!symbol || rows.length === 0) return null;

  const fmt = (n: number) =>
    n.toLocaleString("ar-EG", { maximumFractionDigits: 2 });

  const overdueNames: string[] = [];
  const upcomingLines: string[] = [];
  const exhaustedLines: string[] = [];
  let overdueAmount = 0;
  let totalOutstanding = 0;

  for (const r of rows) {
    totalOutstanding += r.outstanding;

    if (r.sessionsExhausted) {
      exhaustedLines.push(`${r.studentName} — ${r.groupTitle}`);
    }

    if (r.daysLeft != null && r.daysLeft < 0) {
      overdueNames.push(r.studentName);
      overdueAmount += r.overdueAmount;
    } else if (r.daysLeft != null && r.daysLeft <= 7) {
      const when =
        r.daysLeft === 0 ? "اليوم" : r.daysLeft === 1 ? "غدًا" : `بعد ${r.daysLeft} أيام`;
      upcomingLines.push(`${r.studentName} — ${r.groupTitle} (${when})`);
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
