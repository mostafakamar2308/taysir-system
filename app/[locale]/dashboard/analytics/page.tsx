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
            academyId,
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
          cancelledBy: null,
          startTime: {
            lte: now.toDate(),
          },
        },
      });

      const attendedSessions = await db.session.count({
        where: {
          tutorId: tutor.id,
          cancelledBy: null,
          startTime: {
            lte: now.toDate(),
          },
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

  const students = await db.student.findMany({
    where: { academyId },
    select: { id: true, name: true },
  });

  const topStudents = await Promise.all(
    students.map(async (student) => {
      const totalSessions = await db.session.count({
        where: {
          studentId: student.id,
          startTime: { lte: now.toDate() },
        },
      });

      const attendedSessions = await db.session.count({
        where: {
          studentId: student.id,
          startTime: { lte: now.toDate() },
          attendance: {
            studentAttendanceStatus: {
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
        studentId: student.id,
        studentName: student.name,
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
      tutorAttendance={topTutorAttendance}
      topStudents={topFiveStudents}
    />
  );
}
