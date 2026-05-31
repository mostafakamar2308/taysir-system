import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import dayjs from "@/lib/dayjs";
import SessionsManagementClient from "@/components/dashboard/sessionManagement/viewer";

export default async function SessionsManagementPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;

  const now = dayjs.utc();
  const todayStart = now.startOf("day").toDate();
  const todayEnd = now.endOf("day").toDate();

  // 1. Basic session stats
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

  // Cancellation analysis: group by cancelledBy (assuming enum: 0=tutor,1=student, etc.)
  const cancellationsBy = await db.session.groupBy({
    by: ["cancelledBy"],
    where: { academyId, cancelledBy: { not: null } },
    _count: true,
  });
  const cancellationMap = Object.fromEntries(
    cancellationsBy.map((c) => [c.cancelledBy ?? "unknown", c._count]),
  );

  // Absence rate: sessions with attendance where student absent
  const sessionsWithAttendance = await db.session.count({
    where: { academyId, attendance: { isNot: null } },
  });
  const absentSessions = await db.session.count({
    where: {
      academyId,
      attendance: {
        studentAttendanceStatus: {
          in: [1, 2], // ABSENT_EXCUSED = 1, ABSENT_UNEXCUSED = 2 (adjust based on your enum)
        },
      },
    },
  });
  const absenceRate =
    sessionsWithAttendance > 0
      ? (absentSessions / sessionsWithAttendance) * 100
      : 0;

  // 2. Patterns: volume per day of week & per hour (last 30 days)
  const recentSessions = await db.session.findMany({
    where: { academyId, startTime: { gte: now.subtract(30, "day").toDate() } },
    select: { startTime: true },
    orderBy: { startTime: "asc" },
  });

  const dayOfWeekCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);
  recentSessions.forEach((s) => {
    const d = dayjs.utc(s.startTime);
    dayOfWeekCounts[d.day()]++; // 0=Sun, 1=Mon, ... 6=Sat
    hourCounts[d.hour()]++;
  });

  // 3. Quality
  const reportRatings = await db.sessionReport.groupBy({
    by: ["rating"],
    where: { session: { academyId } },
    _count: true,
  });
  const ratingDistribution: Record<number, number> = {};
  reportRatings.forEach((r) => {
    if (r.rating != null) ratingDistribution[r.rating] = r._count;
  });
  const avgRatingResult = await db.sessionReport.aggregate({
    _avg: { rating: true },
    where: { session: { academyId }, rating: { not: null } },
  });
  const avgRating = avgRatingResult._avg.rating ?? 0;

  // 4. Current running sessions
  const runningSessions = await db.session.findMany({
    where: {
      academyId,
      startTime: { lte: now.toDate() },
      endTime: { gte: now.toDate() },
      cancelledBy: null,
    },
    include: {
      student: { select: { user: { select: { name: true } } } },
      tutor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { startTime: "asc" },
  });

  // 5. Today's sessions grouped by tutor
  const todaySessions = await db.session.findMany({
    where: {
      academyId,
      startTime: { gte: todayStart, lte: todayEnd },
    },
    include: {
      student: { select: { user: { select: { name: true, phone: true } } } },
      tutor: { include: { user: { select: { name: true, phone: true } } } },
      attendance: {
        select: {
          studentAttendanceStatus: true,
          tutorAttendanceStatus: true,
          reason: true,
        },
      },
      sessionReport: { select: { rating: true, outcomes: true } },
    },
    orderBy: { startTime: "asc" },
  });

  // Group by tutor
  const groupedByTutor = todaySessions.reduce(
    (acc, s) => {
      const tutorId = s.tutorId;
      if (!acc[tutorId]) {
        acc[tutorId] = {
          tutorName: s.tutor.user.name ?? "غير معروف",
          tutorPhone: s.tutor.user.phone,
          sessions: [],
        };
      }
      acc[tutorId].sessions.push(s);
      return acc;
    },
    {} as Record<
      number,
      {
        tutorName: string;
        tutorPhone: string | null;
        sessions: typeof todaySessions;
      }
    >,
  );

  // Transform for client
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
    byTutor: cancellationMap[0] ?? 0, // assuming 0 = tutor
    byStudent: cancellationMap[1] ?? 0, // assuming 1 = student
    other: cancellationMap[2] ?? 0,
  };

  return (
    <SessionsManagementClient
      stats={stats}
      cancellationAnalysis={cancellationAnalysis}
      dayOfWeekCounts={dayOfWeekCounts}
      hourCounts={hourCounts}
      avgRating={avgRating}
      ratingDistribution={ratingDistribution}
      runningSessions={runningSessions.map((s) => ({
        id: s.id,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        studentName: s.student.user.name || "",
        tutorName: s.tutor.user.name ?? "",
        topic: s.topic,
      }))}
      todayGroupedByTutor={Object.entries(groupedByTutor).map(
        ([tutorId, data]) => ({
          tutorId: parseInt(tutorId),
          tutorName: data.tutorName,
          tutorPhone: data.tutorPhone,
          sessions: data.sessions.map((s) => ({
            id: s.id,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            studentName: s.student.user.name || "",
            studentPhone: s.student.user.phone || "",
            topic: s.topic,
            status: s.cancelledBy ? 2 : s.startTime > now.toDate() ? 0 : 1, // simplified status
            attendance: s.attendance
              ? {
                  studentStatus: s.attendance.studentAttendanceStatus,
                  tutorStatus: s.attendance.tutorAttendanceStatus,
                  reason: s.attendance.reason,
                }
              : null,
            hasReport: !!s.sessionReport,
            reportRating: s.sessionReport?.rating || null,
          })),
        }),
      )}
    />
  );
}
