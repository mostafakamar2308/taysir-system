import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import FinancesClient from "@/components/tutor/finances/viewer";
import dayjs from "@/lib/dayjs";

export default async function TutorFinancesPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Tutor || !currentUser.tutorId) {
    redirect("/login");
  }
  const tutorId = currentUser.tutorId;

  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    include: { currency: true },
  });
  if (!tutor) redirect("/login");

  const privateRate = tutor.privatePricePerHour;
  const groupRate = tutor.groupPricePerHour;
  const currency = tutor.currency.code;

  const now = dayjs.utc();
  const currentMonth = now.format("YYYY-MM");
  const startOfMonth = now.startOf("month").toDate();
  const endOfMonth = now.endOf("month").toDate();

  // ---- current month sessions (non‑cancelled, already started) ----
  const monthSessions = await db.session.findMany({
    where: {
      tutorId,
      startTime: { gte: startOfMonth, lte: endOfMonth },
      cancelledBy: null,
    },
    include: {
      participants: true,
    },
  });

  let totalPrivateMinutes = 0;
  let totalGroupMinutes = 0;
  const sessionCount = monthSessions.length;

  for (const session of monthSessions) {
    const participantCount = session.participants.length;
    if (participantCount <= 1) {
      totalPrivateMinutes += session.durationMinutes;
    } else {
      totalGroupMinutes += session.durationMinutes;
    }
  }

  const expectedEarnings =
    (totalPrivateMinutes / 60) * privateRate +
    (totalGroupMinutes / 60) * groupRate;

  // ---- payments (expenses) ----
  const payments = await db.expense.findMany({
    where: { tutorId },
    orderBy: { date: "desc" },
  });

  const currentMonthPayments = payments.filter(
    (p) => p.salaryMonth === currentMonth,
  );
  const paidThisMonth = currentMonthPayments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const remainingEarnings = expectedEarnings - paidThisMonth;

  const paymentHistory = payments.map((p) => ({
    id: p.id,
    month: p.salaryMonth,
    amount: p.amount,
    status: p.status,
    date: p.date.toISOString(),
    description: p.description,
  }));

  // ---- monthly earnings for chart (last 6 months) ----
  const monthlyEarnings: { month: string; earnings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = now.subtract(i, "month");
    const start = monthDate.startOf("month").toDate();
    const end = monthDate.endOf("month").toDate();

    const sessionsForMonth = await db.session.findMany({
      where: {
        tutorId,
        startTime: { gte: start, lte: end },
        cancelledBy: null,
      },
      include: { participants: true },
    });

    let privateMin = 0;
    let groupMin = 0;
    for (const s of sessionsForMonth) {
      if (s.participants.length <= 1) privateMin += s.durationMinutes;
      else groupMin += s.durationMinutes;
    }
    const earnings =
      (privateMin / 60) * privateRate + (groupMin / 60) * groupRate;
    monthlyEarnings.push({
      month: monthDate.format("MMM YYYY"),
      earnings,
    });
  }

  return (
    <FinancesClient
      sessionCount={sessionCount}
      expectedEarnings={expectedEarnings}
      paidThisMonth={paidThisMonth}
      remainingEarnings={remainingEarnings}
      currency={currency}
      paymentHistory={paymentHistory}
      monthlyEarnings={monthlyEarnings}
    />
  );
}
