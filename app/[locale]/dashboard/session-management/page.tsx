import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import dayjs from "@/lib/dayjs";
import SessionsManagementClient from "@/components/dashboard/sessionManagement/viewer";
import { AttendanceStatus } from "@/types/session";

export default async function SessionsManagementPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;

  const now = dayjs.utc();
  const todayStart = now.startOf("day").toDate();
  const todayEnd = now.endOf("day").toDate();

  // --- 1. Basic stats ---
  const totalSessions = await db.session.count({ where: { academyId } });
  const completedSessions = await db.session.count({
    where: { academyId, startTime: { lte: now.toDate() }, cancelledBy: null },
  });
  const cancelledSessions = await db.session.count({
    where: { academyId, cancelledBy: { not: null } },
  });
  const totalStudents = await db.student.count({ where: { academyId } });
  const totalTutors = await db.tutor.count({
    where: { academyId, active: true },
  });

  // --- Cancellation analysis ---
  const cancellationsBy = await db.session.groupBy({
    by: ["cancelledBy"],
    where: { academyId, cancelledBy: { not: null } },
    _count: true,
  });
  const cancellationMap = Object.fromEntries(
    cancellationsBy.map((c) => [c.cancelledBy ?? "unknown", c._count]),
  );

  // --- Absence rate (new: per participant) ---
  const absentStatuses = [
    AttendanceStatus.ABSENT_EXCUSED,
    AttendanceStatus.ABSENT_UNEXCUSED,
  ];
  const sessionsWithAttendance = await db.session.count({
    where: {
      academyId,
      participants: {
        some: { studentAttendanceStatus: { not: null } },
      },
    },
  });
  const absentSessions = await db.session.count({
    where: {
      academyId,
      participants: {
        some: { studentAttendanceStatus: { in: absentStatuses } },
      },
    },
  });
  const absenceRate =
    sessionsWithAttendance > 0
      ? (absentSessions / sessionsWithAttendance) * 100
      : 0;

  // --- 2. Patterns (unchanged) ---
  const recentSessions = await db.session.findMany({
    where: { academyId, startTime: { gte: now.subtract(30, "day").toDate() } },
    select: { startTime: true },
    orderBy: { startTime: "asc" },
  });
  const dayOfWeekCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);
  recentSessions.forEach((s) => {
    const d = dayjs.utc(s.startTime);
    dayOfWeekCounts[d.day()]++; // 0=Sun … 6=Sat
    hourCounts[d.hour()]++;
  });

  // --- 3. Quality (ratings now from SessionReport linked via participant) ---
  const reportRatings = await db.sessionReport.groupBy({
    by: ["rating"],
    where: {
      participant: { session: { academyId } },
    },
    _count: true,
  });
  const ratingDistribution: Record<number, number> = {};
  reportRatings.forEach((r) => {
    if (r.rating != null) ratingDistribution[r.rating] = r._count;
  });
  const avgRatingResult = await db.sessionReport.aggregate({
    _avg: { rating: true },
    where: {
      participant: { session: { academyId } },
      rating: { not: null },
    },
  });
  const avgRating = avgRatingResult._avg.rating ?? 0;

  // --- 4. Running sessions ---
  const runningSessions = await db.session.findMany({
    where: {
      academyId,
      startTime: { lte: now.toDate() },
      endTime: { gte: now.toDate() },
      cancelledBy: null,
    },
    include: {
      participants: {
        include: {
          student: { select: { user: { select: { name: true } } } },
        },
      },
      tutor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { startTime: "asc" },
  });

  // --- 5. Today's sessions grouped by tutor ---
  const todaySessions = await db.session.findMany({
    where: {
      academyId,
      startTime: { gte: todayStart, lte: todayEnd },
    },
    include: {
      participants: {
        include: {
          student: {
            select: { user: { select: { name: true, phone: true } } },
          },
          report: { select: { rating: true, outcomes: true } },
        },
      },
      tutor: { include: { user: { select: { name: true, phone: true } } } },
    },
    orderBy: { startTime: "asc" },
  });

  // Group by tutor
  const groupedByTutor: Record<
    number,
    {
      tutorName: string;
      tutorPhone: string | null;
      sessions: typeof todaySessions;
    }
  > = {};
  todaySessions.forEach((s) => {
    const tid = s.tutorId;
    if (!groupedByTutor[tid]) {
      groupedByTutor[tid] = {
        tutorName: s.tutor.user.name ?? "غير معروف",
        tutorPhone: s.tutor.user.phone,
        sessions: [],
      };
    }
    groupedByTutor[tid].sessions.push(s);
  });

  // --- Transformations for client ---
  const stats = {
    totalSessions,
    avgPerStudent:
      totalStudents > 0 ? (totalSessions / totalStudents).toFixed(1) : "0",
    avgPerTutor:
      totalTutors > 0 ? (totalSessions / totalTutors).toFixed(1) : "0",
    completionRate:
      totalSessions > 0
        ? ((completedSessions / totalSessions) * 100).toFixed(1)
        : "0",
    cancellationRate:
      totalSessions > 0
        ? ((cancelledSessions / totalSessions) * 100).toFixed(1)
        : "0",
    absenceRate: absenceRate.toFixed(1),
  };

  const cancellationAnalysis = {
    byTutor: cancellationMap[0] ?? 0,
    byStudent: cancellationMap[1] ?? 0,
    other: cancellationMap[2] ?? 0,
  };

  // Running sessions client data
  const clientRunningSessions = runningSessions.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    studentName:
      s.participants.map((p) => p.student.user.name).join("، ") || "",
    tutorName: s.tutor.user.name ?? "",
    topic: s.topic,
  }));

  // Today's sessions client data
  const clientTodayGroupedByTutor = Object.entries(groupedByTutor).map(
    ([tutorId, data]) => ({
      tutorId: parseInt(tutorId),
      tutorName: data.tutorName,
      tutorPhone: data.tutorPhone,
      sessions: data.sessions.map((s) => {
        const firstParticipant = s.participants[0];
        const joinedNames = s.participants
          .map((p) => p.student.user.name || "")
          .join("، ");
        const hasAttendance = s.participants.some(
          (p) => p.studentAttendanceStatus !== null,
        );
        const attendanceStatus =
          firstParticipant?.studentAttendanceStatus ?? null;
        const hasReport = s.participants.some((p) => p.report !== null);
        const reportRating = firstParticipant?.report?.rating ?? null;

        return {
          id: s.id,
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
          studentName: joinedNames || "",
          studentPhone: firstParticipant?.student.user.phone || null,
          topic: s.topic,
          status: s.cancelledBy ? 2 : s.startTime > now.toDate() ? 0 : 1, // 0 scheduled, 1 completed, 2 cancelled
          attendance: hasAttendance
            ? {
                studentStatus: attendanceStatus,
                tutorStatus: null, // no global tutor attendance
                reason: null,
              }
            : null,
          hasReport,
          reportRating,
        };
      }),
    }),
  );

  return (
    <SessionsManagementClient
      stats={stats}
      cancellationAnalysis={cancellationAnalysis}
      dayOfWeekCounts={dayOfWeekCounts}
      hourCounts={hourCounts}
      avgRating={avgRating}
      ratingDistribution={ratingDistribution}
      runningSessions={clientRunningSessions}
      todayGroupedByTutor={clientTodayGroupedByTutor}
    />
  );
}
