import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import StudentAnalyticsClient from "@/components/dashboard/studentAnalytics/viewer";
import { AttendanceStatus, SessionStatus } from "@/types/session";

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
      sessions: {
        include: { attendance: true },
        orderBy: { startTime: "desc" },
      },
      studentProgramEnrollments: {
        where: { status: 0 }, // active
        include: {
          program: true,
          topics: {
            include: { topic: true },
            orderBy: { topic: { order: "asc" } },
          },
        },
        take: 1,
      },
    },
  });

  if (!student) notFound();

  // Compute summary stats
  const totalSessions = student.sessions.length;
  const attendedSessions = student.sessions.filter(
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

  const currentEnrollment = student.studentProgramEnrollments[0];
  const completedTopics =
    currentEnrollment?.topics.filter((t) => t.completed).length || 0;
  const totalTopics = currentEnrollment?.topics.length || 0;

  // Monthly topic progress (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      monthKey: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("ar-EG", { month: "short" }),
    };
  }).reverse();

  const topicProgressOverTime = await Promise.all(
    months.map(async ({ monthKey, label }) => {
      const start = new Date(monthKey + "-01");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      // Count topics completed in that month (based on completedAt)
      const count = currentEnrollment
        ? currentEnrollment.topics.filter(
            (t) =>
              t.completedAt && t.completedAt >= start && t.completedAt < end,
          ).length
        : 0;
      return { month: monthKey, label, value: count };
    }),
  );

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
          s.status === SessionStatus.COMPLETED &&
          s.attendance?.status &&
          [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
            s.attendance.status,
          ),
      ).length;
      const rate =
        monthSessions.length > 0
          ? Math.round((monthAttended / monthSessions.length) * 100)
          : 0;
      return { month: monthKey, label, value: rate };
    }),
  );

  // Topics with completion details
  const topicsWithProgress =
    currentEnrollment?.topics.map((t) => ({
      id: t.id,
      title: t.topic.title,
      description: t.topic.description,
      completed: t.completed,
      completedAt: t.completedAt?.toISOString().split("T")[0] ?? null,
      notes: t.notes,
    })) ?? [];

  return (
    <StudentAnalyticsClient
      studentName={student.name}
      studentStatus={student.status}
      totalSessions={totalSessions}
      attendanceRate={attendanceRate}
      completedTopics={completedTopics}
      totalTopics={totalTopics}
      programName={currentEnrollment?.program.name ?? "—"}
      topicProgressOverTime={topicProgressOverTime}
      attendanceTrend={attendanceTrend}
      topics={topicsWithProgress}
    />
  );
}
