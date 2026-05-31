import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import StudentAnalyticsClient from "@/components/dashboard/studentAnalytics/viewer";
import { AttendanceStatus } from "@/types/session";
import dayjs from "@/lib/dayjs";

export default async function StudentAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const studentId = parseInt((await params).id);
  if (isNaN(studentId)) notFound();

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      tutor: { include: { user: true } },
      user: {
        select: { name: true },
      },
      sessions: {
        where: {
          startTime: {
            lte: dayjs().toDate(),
          },
        },
        include: { attendance: true },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!student) notFound();

  // Compute summary stats
  const totalSessions = student.sessions.length;
  const attendedSessions = student.sessions.filter(
    (s) =>
      dayjs(s.startTime).isBefore(dayjs()) &&
      s.attendance?.studentAttendanceStatus !== undefined &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        s.attendance.studentAttendanceStatus,
      ),
  ).length;
  const attendanceRate =
    totalSessions > 0
      ? Math.round((attendedSessions / totalSessions) * 100)
      : 0;

  // Monthly topic progress (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      monthKey: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("ar-EG", { month: "short" }),
    };
  }).reverse();

  // Monthly attendance trend
  const attendanceTrend = await Promise.all(
    months.map(async ({ monthKey, label }) => {
      const start = new Date(monthKey + "-01");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const monthSessions = student.sessions.filter(
        (s) => s.startTime >= start && s.startTime < end,
      );

      const monthAttended = monthSessions.filter(
        (s) =>
          dayjs(s.startTime).isBefore(dayjs()) &&
          s.attendance?.studentAttendanceStatus !== undefined &&
          [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
            s.attendance.studentAttendanceStatus,
          ),
      ).length;
      const rate =
        monthSessions.length > 0
          ? Math.round((monthAttended / monthSessions.length) * 100)
          : 0;
      return { month: monthKey, label, value: rate };
    }),
  );

  return (
    <StudentAnalyticsClient
      studentName={student.user.name || ""}
      studentStatus={student.status}
      totalSessions={totalSessions}
      attendanceRate={attendanceRate}
      attendanceTrend={attendanceTrend}
    />
  );
}
