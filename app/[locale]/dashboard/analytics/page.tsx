import db from "@/lib/prisma";
import { SessionStatus, AttendanceStatus } from "@/types/session";
import AnalyticsClient from "@/components/dashboard/analytics/viewer";
import { notFound } from "next/navigation";
import { PaymentStatus } from "@/types/payment";

export default async function AnalyticsPage() {
  const academy = await db.academy.findFirst();
  if (!academy) notFound();
  const academyId = academy.id;

  // Helper: get month labels for the last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      monthKey: d.toISOString().slice(0, 7), // YYYY-MM
      label: d.toLocaleDateString("ar-EG", { month: "long" }),
    };
  }).reverse();

  // -------------------- Student Growth --------------------
  const studentGrowth = await Promise.all(
    last6Months.map(async ({ monthKey, label }) => {
      const start = new Date(monthKey + "-01");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const count = await db.student.count({
        where: {
          academyId,
          createdAt: { lt: end },
        },
      });
      return { month: monthKey, label, value: count };
    }),
  );

  // -------------------- Revenue vs Expenses --------------------
  const revenueExpense = await Promise.all(
    last6Months.map(async ({ monthKey, label }) => {
      const start = new Date(monthKey + "-01");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const [revenueResult, expenseResult] = await Promise.all([
        db.revenue.aggregate({
          where: {
            student: { academyId },
            date: { gte: start, lt: end },
            status: 1, // PAID
          },
          _sum: { amount: true },
        }),
        db.expense.aggregate({
          where: {
            academyId,
            date: { gte: start, lt: end },
            status: PaymentStatus.PAID,
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        month: label,
        revenue: revenueResult._sum.amount || 0,
        expenses: expenseResult._sum.amount || 0,
      };
    }),
  );

  // -------------------- Tutor Attendance --------------------
  const tutors = await db.tutor.findMany({
    where: { academyId, active: true },
    include: { user: true },
  });

  const tutorAttendance = await Promise.all(
    tutors.map(async (tutor) => {
      const totalSessions = await db.session.count({
        where: {
          tutorId: tutor.id,
          status: SessionStatus.COMPLETED,
        },
      });

      const attendedSessions = await db.session.count({
        where: {
          tutorId: tutor.id,
          status: SessionStatus.COMPLETED,
          attendance: {
            tutorAttendanceStatus: {
              in: [AttendanceStatus.ATTENDED, AttendanceStatus.LATE],
            },
          },
        },
      });

      const attendanceRate =
        totalSessions > 0
          ? Math.round((attendedSessions / totalSessions) * 100)
          : 0;

      return {
        tutorId: tutor.id,
        tutorName: tutor.user.name ?? "",
        attendanceRate,
        totalSessions,
      };
    }),
  );

  // Sort by attendance rate descending, take top 5
  const topTutorAttendance = tutorAttendance
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5);

  return (
    <AnalyticsClient
      studentGrowth={studentGrowth}
      revenueExpense={revenueExpense}
      tutorAttendance={topTutorAttendance}
    />
  );
}
