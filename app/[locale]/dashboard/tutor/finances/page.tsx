import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { AttendanceStatus } from "@/types/session";
import FinancesClient from "@/components/tutor/finances/viewer";
import dayjs from "@/lib/dayjs";

export default async function TutorFinancesPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Tutor || !currentUser.tutorId) {
    redirect("/login");
  }
  const tutorId = currentUser.tutorId;

  // Get tutor's price per session and currency
  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    include: { currency: true },
  });
  if (!tutor) redirect("/login");
  const pricePerSession = tutor.pricePerSession;
  const currency = tutor.currency.code;

  const now = dayjs.utc();
  const currentMonth = now.format("YYYY-MM");
  const startOfMonth = now.startOf("month").toDate();
  const endOfMonth = now.endOf("month").toDate();

  // Fetch sessions for current month that were completed and attended (by tutor)
  const monthSessions = await db.session.findMany({
    where: {
      tutorId,
      startTime: { gte: startOfMonth, lte: endOfMonth },
      attendance: {
        tutorAttendanceStatus: {
          in: [AttendanceStatus.ATTENDED, AttendanceStatus.LATE],
        },
      },
    },
  });
  const sessionCount = monthSessions.length;
  const expectedEarnings = sessionCount * pricePerSession;

  // Fetch payments (expenses) for this tutor
  const payments = await db.expense.findMany({
    where: {
      tutorId,
    },
    orderBy: { date: "desc" },
  });

  // Calculate totals for current month
  const currentMonthPayments = payments.filter(
    (p) => p.salaryMonth === currentMonth,
  );
  const paidThisMonth = currentMonthPayments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const remainingEarnings = expectedEarnings - paidThisMonth;

  // Prepare payment history (last 12 months or all)
  const paymentHistory = payments.map((p) => ({
    id: p.id,
    month: p.salaryMonth,
    amount: p.amount,
    status: p.status,
    date: p.date.toISOString(),
    description: p.description,
  }));

  // Compute earnings by month for chart (last 6 months)
  const monthlyEarnings: { month: string; earnings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = now.subtract(i, "month");
    const sessionsForMonth = await db.session.findMany({
      where: {
        tutorId,
        startTime: {
          gte: monthDate.startOf("month").toDate(),
          lte: monthDate.endOf("month").toDate(),
        },
        attendance: {
          tutorAttendanceStatus: {
            in: [AttendanceStatus.ATTENDED, AttendanceStatus.LATE],
          },
        },
      },
    });
    const count = sessionsForMonth.length;
    const earnings = count * pricePerSession;
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
