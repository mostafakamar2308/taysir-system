import db from "@/lib/prisma";
import { SessionStatus, AttendanceStatus } from "@/types/session";
import AnalyticsClient from "@/components/dashboard/analytics/viewer";
import { notFound } from "next/navigation";

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
        db.payment.aggregate({
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
            paid: true,
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
            status: { in: [AttendanceStatus.ATTENDED, AttendanceStatus.LATE] },
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

  // -------------------- Program Completion --------------------
  const enrollments = await db.studentProgramEnrollment.groupBy({
    by: ["status"],
    where: { program: { academyId } },
    _count: { _all: true },
  });

  const statusMap: Record<number, { name: string; fill: string }> = {
    0: { name: "نشط", fill: "hsl(var(--primary))" },
    1: { name: "مكتمل", fill: "hsl(200 70% 50%)" },
    2: { name: "منسحب", fill: "hsl(var(--destructive))" },
  };

  const programCompletion = enrollments.map((e) => ({
    name: statusMap[e.status]?.name || "أخرى",
    value: e._count._all,
    fill: statusMap[e.status]?.fill || "hsl(var(--muted))",
  }));

  // -------------------- Student Progress --------------------
  const activeEnrollments = await db.studentProgramEnrollment.findMany({
    where: {
      program: { academyId },
      status: 0, // active
    },
    include: {
      student: { select: { id: true, name: true } },
      program: { select: { name: true } },
      topics: { select: { completed: true } },
    },
    take: 10,
  });

  const studentProgress = await Promise.all(
    activeEnrollments.map(async (enrollment) => {
      const totalTopics = enrollment.topics.length;
      const completedTopics = enrollment.topics.filter(
        (t) => t.completed,
      ).length;

      // attendance rate for this student (across all sessions)
      const sessions = await db.session.findMany({
        where: { studentId: enrollment.studentId },
        include: { attendance: true },
      });
      const totalSessions = sessions.filter(
        (s) => s.status === SessionStatus.COMPLETED,
      ).length;
      const attendedSessions = sessions.filter(
        (s) =>
          s.status === SessionStatus.COMPLETED &&
          s.attendance?.status &&
          [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
            s.attendance.status,
          ),
      ).length;
      const attendanceRate =
        totalSessions > 0
          ? Math.round((attendedSessions / totalSessions) * 100)
          : 0;

      return {
        studentId: enrollment.student.id,
        studentName: enrollment.student.name,
        programName: enrollment.program.name,
        completedTopics,
        totalTopics,
        attendanceRate,
      };
    }),
  );

  return (
    <AnalyticsClient
      studentGrowth={studentGrowth}
      revenueExpense={revenueExpense}
      tutorAttendance={topTutorAttendance}
      programCompletion={programCompletion}
      studentProgress={studentProgress}
    />
  );
}
