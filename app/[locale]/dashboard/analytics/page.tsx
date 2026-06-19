import db from "@/lib/prisma";
import { AttendanceStatus } from "@/types/session";
import AnalyticsClient from "@/components/dashboard/analytics/viewer";
import { redirect } from "next/navigation";
import { PaymentStatus } from "@/types/payment";
import dayjs from "@/lib/dayjs";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";

export default async function AnalyticsPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Admin || !currentUser.academyId)
    redirect("/login");
  const { academyId } = currentUser;

  const now = dayjs();

  // Last 6 months labels
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      monthKey: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("ar-EG", { month: "long" }),
    };
  }).reverse();

  // ---- Student Growth (unchanged) ----
  const studentGrowth = await Promise.all(
    last6Months.map(async ({ monthKey, label }) => {
      const start = new Date(monthKey + "-01");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const count = await db.student.count({
        where: { academyId, createdAt: { lt: end } },
      });
      return { month: monthKey, label, value: count };
    }),
  );

  // ---- Revenue vs Expenses (unchanged) ----
  const revenueExpense = await Promise.all(
    last6Months.map(async ({ monthKey, label }) => {
      const start = new Date(monthKey + "-01");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const [revenueResult, expenseResult] = await Promise.all([
        db.revenue.aggregate({
          where: {
            academyId,
            student: { academyId },
            dueDate: { gte: start, lt: end },
            status: PaymentStatus.PAID,
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

  // ---- Tutor Completion Rate (new logic) ----
  const tutors = await db.tutor.findMany({
    where: { academyId, active: true },
    include: { user: true },
  });

  const tutorCompletion = await Promise.all(
    tutors.map(async (tutor) => {
      const totalSessions = await db.session.count({
        where: {
          tutorId: tutor.id,
          cancelledBy: null,
          startTime: { lte: now.toDate() },
        },
      });

      // We'll treat any non‑cancelled past session as "completed" (no attendance needed)
      const completedSessions = totalSessions; // already filtered cancelledBy = null

      const completionRate =
        totalSessions > 0
          ? Math.round((completedSessions / totalSessions) * 100)
          : 0;

      return {
        tutorId: tutor.id,
        tutorName: tutor.user.name ?? "",
        completionRate,
        totalSessions,
      };
    }),
  );

  // Sort by completion rate descending, top 5
  const topTutorCompletion = tutorCompletion
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5);

  // ---- Student Attendance (per participant) ----
  const students = await db.student.findMany({
    where: { academyId },
    select: { id: true, user: { select: { name: true } } },
  });

  const topStudents = await Promise.all(
    students.map(async (student) => {
      const totalParticipants = await db.sessionParticipant.count({
        where: {
          studentId: student.id,
          session: {
            startTime: { lte: now.toDate() },
            cancelledBy: null,
          },
        },
      });

      const attendedParticipants = await db.sessionParticipant.count({
        where: {
          studentId: student.id,
          studentAttendanceStatus: {
            in: [AttendanceStatus.ATTENDED, AttendanceStatus.LATE],
          },
          session: {
            startTime: { lte: now.toDate() },
            cancelledBy: null,
          },
        },
      });

      const attendanceRate =
        totalParticipants > 0
          ? Math.round((attendedParticipants / totalParticipants) * 100)
          : 0;

      return {
        studentId: student.id,
        studentName: student.user.name || "",
        attendanceRate,
      };
    }),
  );

  const topFiveStudents = topStudents
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5);

  return (
    <AnalyticsClient
      studentGrowth={studentGrowth}
      revenueExpense={revenueExpense}
      tutorCompletion={topTutorCompletion}
      topStudents={topFiveStudents}
    />
  );
}
