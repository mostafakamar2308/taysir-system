import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import TutorProfileClient from "@/components/dashboard/tutorProfile/viewer";
import dayjs from "@/lib/dayjs";
import { AttendanceStatus } from "@/types/session";
import type { TutorProfile, GroupSummary } from "@/types/tutor";
import { user } from "@/lib/auth";

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) notFound();
  const academyId = currentUser.academyId;

  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const startOfMonth = dayjs.utc().startOf("month").toDate();
  const endOfMonth = dayjs.utc().endOf("month").toDate();

  const tutor = await db.tutor.findUnique({
    where: { id },
    include: {
      user: true,
      specialities: true,
      currency: true,
      groups: {
        where: { active: true },
        include: {
          members: {
            where: { active: true },
            include: {
              student: {
                select: { id: true, user: { select: { name: true } } },
              },
            },
          },
          sessions: {
            orderBy: { startTime: "desc" },
            take: 5,
            select: { startTime: true },
          },
        },
      },
      expenses: {
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        select: { amount: true, status: true },
      },
    },
  });

  if (!tutor) notFound();

  // --- Groups summary ---
  const groups: GroupSummary[] = tutor.groups.map((g) => {
    const sorted = g.sessions.map((s) => dayjs.utc(s.startTime));
    const future = sorted.filter((d) => d.isAfter(dayjs.utc()));
    const past = sorted.filter((d) => d.isBefore(dayjs.utc()));
    return {
      id: g.id,
      title: g.title,
      nextSessionDate: future.length > 0 ? future[0].toISOString() : null,
      latestSessionDate:
        past.length > 0 ? past[past.length - 1].toISOString() : null,
      members: g.members.map((m) => ({
        id: m.student.id,
        name: m.student.user.name ?? "",
      })),
    };
  });

  // --- Monthly sessions & performance ---
  const monthSessions = await db.session.findMany({
    where: {
      tutorId: id,
      startTime: { gte: startOfMonth, lte: endOfMonth },
      cancelledBy: null,
    },
    include: {
      participants: {
        include: { report: true, homeworkSolutions: true },
      },
      assignment: { include: { solutions: true } },
    },
  });

  const allParticipants = monthSessions.flatMap((s) =>
    s.participants.map((p) => ({ ...p, sessionId: s.id })),
  );
  const uniqueSessionIds = new Set(monthSessions.map((s) => s.id));
  const totalSessions = uniqueSessionIds.size;
  const attendedSessions = monthSessions.filter((s) =>
    s.participants.some((p) => p.studentAttendanceStatus !== null),
  ).length;

  const totalPrivateMinutes = monthSessions
    .filter((s) => s.participants.length <= 1)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalGroupMinutes = monthSessions
    .filter((s) => s.participants.length > 1)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalEarnings =
    (totalPrivateMinutes / 60) * tutor.baseHourlyRate +
    (totalGroupMinutes / 60) * tutor.baseGroupHourlyRate;

  const paidThisMonth = tutor.expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingThisMonth = totalEarnings - paidThisMonth;

  const totalWithStatus = allParticipants.filter(
    (p) => p.studentAttendanceStatus !== null,
  ).length;
  const attendedCount = allParticipants.filter(
    (p) =>
      p.studentAttendanceStatus !== null &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        p.studentAttendanceStatus,
      ),
  ).length;
  const attendanceRate =
    totalWithStatus > 0 ? (attendedCount / totalWithStatus) * 100 : 0;

  const participantsWithAttendance = allParticipants.filter(
    (p) =>
      p.studentAttendanceStatus !== null &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        p.studentAttendanceStatus,
      ),
  );
  const reportsFilled = participantsWithAttendance.filter(
    (p) => p.report,
  ).length;
  const reportAdherence =
    participantsWithAttendance.length > 0
      ? (reportsFilled / participantsWithAttendance.length) * 100
      : 0;

  const highQualityReports = participantsWithAttendance.filter(
    (p) =>
      p.report &&
      p.report.outcomes &&
      p.report.strengths &&
      p.report.weaknesses &&
      p.report.nextGoals,
  ).length;
  const reportQuality =
    reportsFilled > 0 ? (highQualityReports / reportsFilled) * 100 : 0;

  // Homework grading: count of solutions graded by this tutor (gradedBy = tutor.userId)
  const gradedSolutions = await db.homeworkSolution.count({
    where: {
      gradedBy: tutor.userId,
      gradedAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  const performanceMetrics = {
    attendanceRate,
    reportAdherence,
    reportQuality,
    homeworkGradingCount: gradedSolutions,
    weightedScore:
      attendanceRate * 0.35 +
      reportAdherence * 0.25 +
      reportQuality * 0.25 +
      (gradedSolutions > 0 ? 0.15 : 0),
    scoreHint: "",
    scoreColor: "",
  };

  const totalScore = performanceMetrics.weightedScore;
  if (totalScore >= 70) {
    performanceMetrics.scoreHint = "أداء ممتاز";
    performanceMetrics.scoreColor = "text-green-600";
  } else if (totalScore >= 60) {
    performanceMetrics.scoreHint = "أداء جيد";
    performanceMetrics.scoreColor = "text-yellow-600";
  } else {
    performanceMetrics.scoreHint = "يحتاج تحسين";
    performanceMetrics.scoreColor = "text-red-600";
  }

  const transformed: TutorProfile = {
    id: tutor.id,
    name: tutor.user.name ?? "",
    email: tutor.user.email,
    phone: tutor.user.phone,
    timezone: tutor.user.timezone,
    active: tutor.active ?? false,
    specialities: tutor.specialities.map((s) => s.title),
    baseHourlyRate: tutor.baseHourlyRate,
    baseGroupHourlyRate: tutor.baseGroupHourlyRate,
    currency: tutor.currency.code,
    zoomUrl: tutor.zoomUrl,
    groups,
    monthlyStats: {
      totalSessions,
      attendedSessions,
      attendanceRate,
      totalEarnings,
      paid: paidThisMonth,
      pending: pendingThisMonth,
    },
    performanceMetrics,
  };

  return <TutorProfileClient tutor={transformed} academyId={academyId} />;
}
