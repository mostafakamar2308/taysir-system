import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import TutorAnalyticsClient from "@/components/dashboard/tutorAnalytics/viewer";
import { AttendanceStatus, SessionStatus } from "@/types/session";

export default async function TutorAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tutorId = parseInt((await params).id);
  if (isNaN(tutorId)) notFound();

  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    include: {
      user: true,
      specialities: true,
      students: { select: { id: true } },
      sessions: {
        include: { attendance: true },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!tutor) notFound();

  // Compute summary stats
  const studentCount = tutor.students.length;
  const totalSessions = tutor.sessions.length;

  // Average attendance across all sessions taught by this tutor
  const completedSessions = tutor.sessions.filter(
    (s) => s.status === SessionStatus.COMPLETED,
  );
  const attendedSessions = completedSessions.filter(
    (s) =>
      s.attendance?.status &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        s.attendance.status,
      ),
  ).length;
  const avgAttendance =
    completedSessions.length > 0
      ? Math.round((attendedSessions / completedSessions.length) * 100)
      : 0;

  // Total salary expenses for this tutor (from Expense model)
  const salaryTotal = await db.expense.aggregate({
    where: { tutorId, costCenter: "رواتب" },
    _sum: { amount: true },
  });

  const totalSalary = salaryTotal._sum.amount ?? 0;

  // Monthly sessions taught (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      monthKey: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("ar-EG", { month: "short" }),
    };
  }).reverse();

  const sessionsTaught = await Promise.all(
    months.map(async ({ monthKey, label }) => {
      const start = new Date(monthKey + "-01");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const count = await db.session.count({
        where: {
          tutorId,
          startTime: { gte: start, lt: end },
        },
      });
      return { month: monthKey, label, value: count };
    }),
  );

  // Attendance breakdown
  const attendanceBreakdown = [
    {
      name: "حاضر",
      value: tutor.sessions.filter(
        (s) => s.attendance?.status === AttendanceStatus.ATTENDED,
      ).length,
      fill: "hsl(var(--primary))",
    },
    {
      name: "غائب بعذر",
      value: tutor.sessions.filter(
        (s) => s.attendance?.status === AttendanceStatus.ABSENT_EXCUSED,
      ).length,
      fill: "hsl(43 74% 52%)",
    },
    {
      name: "غائب بدون عذر",
      value: tutor.sessions.filter(
        (s) => s.attendance?.status === AttendanceStatus.ABSENT_UNEXCUSED,
      ).length,
      fill: "hsl(var(--destructive))",
    },
    {
      name: "متأخر",
      value: tutor.sessions.filter(
        (s) => s.attendance?.status === AttendanceStatus.LATE,
      ).length,
      fill: "hsl(25 95% 53%)",
    },
    {
      name: "ملغى",
      value: tutor.sessions.filter(
        (s) => s.attendance?.status === AttendanceStatus.CANCELLED,
      ).length,
      fill: "hsl(var(--muted))",
    },
  ].filter((item) => item.value > 0);

  // Top students by attendance (among those assigned to this tutor)
  const students = await db.student.findMany({
    where: { tutorId },
    select: { id: true, name: true },
  });

  const topStudents = await Promise.all(
    students.map(async (student) => {
      const studentSessions = await db.session.findMany({
        where: { studentId: student.id, tutorId },
        include: { attendance: true },
      });
      const completed = studentSessions.filter(
        (s) => s.status === SessionStatus.COMPLETED,
      );
      const attended = completed.filter(
        (s) =>
          s.attendance?.status &&
          [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
            s.attendance.status,
          ),
      ).length;
      const rate =
        completed.length > 0
          ? Math.round((attended / completed.length) * 100)
          : 0;
      return {
        studentId: student.id,
        studentName: student.name,
        attendanceRate: rate,
        // program name – we could fetch from enrollment, but for simplicity, we'll leave empty
        programName: "—",
      };
    }),
  ).then((results) =>
    results.sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 5),
  );

  return (
    <TutorAnalyticsClient
      tutorName={tutor.user.name ?? ""}
      specialities={tutor.specialities.map((s) => s.title)}
      studentCount={studentCount}
      totalSessions={totalSessions}
      avgAttendance={avgAttendance}
      totalSalary={totalSalary}
      sessionsTaught={sessionsTaught}
      attendanceBreakdown={attendanceBreakdown}
      topStudents={topStudents}
    />
  );
}
