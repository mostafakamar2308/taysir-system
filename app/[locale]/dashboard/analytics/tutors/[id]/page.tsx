import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import TutorAnalyticsClient from "@/components/dashboard/tutorAnalytics/viewer";
import { AttendanceStatus } from "@/types/session";
import dayjs from "@/lib/dayjs";

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
    },
  });

  if (!tutor) notFound();

  // ---- summary stats ----
  const studentCount = tutor.students.length;

  // total past non‑cancelled sessions
  const totalSessions = await db.session.count({
    where: {
      tutorId,
      startTime: { lte: dayjs().toDate() },
      cancelledBy: null,
    },
  });

  // ---- avg student attendance from participants ----
  const attendanceStats = await db.sessionParticipant.groupBy({
    by: ["studentAttendanceStatus"],
    where: {
      session: {
        tutorId,
        startTime: { lte: dayjs().toDate() },
        cancelledBy: null,
      },
    },
    _count: true,
  });

  const totalParticipations = attendanceStats.reduce(
    (sum, g) => sum + g._count,
    0,
  );
  const attendedCount = attendanceStats
    .filter(
      (g) =>
        g.studentAttendanceStatus !== null &&
        [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
          g.studentAttendanceStatus,
        ),
    )
    .reduce((sum, g) => sum + g._count, 0);

  const avgAttendance =
    totalParticipations > 0
      ? Math.round((attendedCount / totalParticipations) * 100)
      : 0;

  // ---- total salary ----
  const salaryTotal = await db.expense.aggregate({
    where: { tutorId },
    _sum: { amount: true },
  });
  const totalSalary = salaryTotal._sum.amount ?? 0;

  // ---- monthly sessions taught (last 6 months) ----
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

  // ---- attendance breakdown (student participation) ----
  const statusMap: Record<number, string> = {
    [AttendanceStatus.ATTENDED]: "حاضر",
    [AttendanceStatus.LATE]: "متأخر",
    [AttendanceStatus.ABSENT_EXCUSED]: "غائب بعذر",
    [AttendanceStatus.ABSENT_UNEXCUSED]: "غائب بدون عذر",
  };
  const statusColors: Record<number, string> = {
    [AttendanceStatus.ATTENDED]: "hsl(20 24% 52%)",
    [AttendanceStatus.LATE]: "hsl(25 95% 53%)",
    [AttendanceStatus.ABSENT_EXCUSED]: "hsl(43 74% 52%)",
    [AttendanceStatus.ABSENT_UNEXCUSED]: "hsl(var(--destructive))",
  };

  const attendanceBreakdown = attendanceStats
    .filter((g) => g.studentAttendanceStatus !== null)
    .map((g) => ({
      name: statusMap[g.studentAttendanceStatus!] ?? "غير معروف",
      value: g._count,
      fill: statusColors[g.studentAttendanceStatus!] ?? "hsl(var(--muted))",
    }))
    .filter((item) => item.value > 0);

  // ---- top students by attendance (from this tutor) ----
  const students = await db.student.findMany({
    where: { tutorId },
    select: { id: true, user: { select: { name: true } } },
  });

  const topStudents = await Promise.all(
    students.map(async (student) => {
      const studentStats = await db.sessionParticipant.groupBy({
        by: ["studentAttendanceStatus"],
        where: {
          studentId: student.id,
          session: {
            tutorId,
            startTime: { lte: dayjs().toDate() },
            cancelledBy: null,
          },
        },
        _count: true,
      });

      const total = studentStats.reduce((sum, g) => sum + g._count, 0);
      const attended = studentStats
        .filter(
          (g) =>
            g.studentAttendanceStatus !== null &&
            [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
              g.studentAttendanceStatus,
            ),
        )
        .reduce((sum, g) => sum + g._count, 0);

      const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
      return {
        studentId: student.id,
        studentName: student.user.name || "",
        attendanceRate: rate,
        programName: "—", // no currentProgram field in the minimal select, can be fetched if needed
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
