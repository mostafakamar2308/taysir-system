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
    select: {
      id: true,
      status: true,
      user: { select: { name: true } },
    },
  });
  if (!student) notFound();

  const now = dayjs().toDate();

  // All participations in past non‑cancelled sessions
  const participants = await db.sessionParticipant.findMany({
    where: {
      studentId,
      session: {
        cancelledBy: null,
        startTime: { lte: now },
      },
    },
    select: {
      sessionId: true,
      studentAttendanceStatus: true,
      session: { select: { startTime: true } },
    },
  });

  // Distinct sessions the student was in
  const allSessionIds = new Set(participants.map((p) => p.sessionId));
  const totalSessions = allSessionIds.size;

  // Sessions where the student actually attended
  const attendedSessionIds = new Set(
    participants
      .filter(
        (p) =>
          p.studentAttendanceStatus !== null &&
          [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
            p.studentAttendanceStatus,
          ),
      )
      .map((p) => p.sessionId),
  );
  const attendedSessions = attendedSessionIds.size;
  const attendanceRate =
    totalSessions > 0
      ? Math.round((attendedSessions / totalSessions) * 100)
      : 0;

  // Monthly trend (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      label: d.toLocaleDateString("ar-EG", { month: "short" }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    };
  }).reverse();

  const attendanceTrend = months.map(({ label, start, end }) => {
    const monthParticipants = participants.filter((p) => {
      const t = p.session.startTime;
      return t >= start && t < end;
    });
    const monthSessionIds = new Set(monthParticipants.map((p) => p.sessionId));
    const monthAttendedIds = new Set(
      monthParticipants
        .filter(
          (p) =>
            p.studentAttendanceStatus !== null &&
            [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
              p.studentAttendanceStatus,
            ),
        )
        .map((p) => p.sessionId),
    );
    const monthTotal = monthSessionIds.size;
    const monthAttended = monthAttendedIds.size;
    const rate =
      monthTotal > 0 ? Math.round((monthAttended / monthTotal) * 100) : 0;
    return { month: label, label, value: rate };
  });

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
