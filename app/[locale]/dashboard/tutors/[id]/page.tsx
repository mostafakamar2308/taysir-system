import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import TutorProfileClient from "@/components/dashboard/tutorProfile/viewer";
import dayjs from "@/lib/dayjs";
import { AttendanceStatus } from "@/types/session";
import type {
  TutorProfile,
  GroupSummary,
  SupervisorReview,
} from "@/types/tutor";
import { user } from "@/lib/auth";
import { getTutorFinancialSummary } from "@/actions/tutorFinances";
import type { TutorFinancesInput } from "@/types/tutorFinances";

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

  const totalEarnings = monthSessions.reduce(
    (sum, s) => sum + (s.tutorRate * s.durationMinutes) / 60,
    0,
  );

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

  // --- Supervisor attendance reviews (TutorAttendance) ---
  const attendanceReviews = await db.tutorAttendance.findMany({
    where: { session: { tutorId: id }, notes: { not: null } },
    orderBy: { reviewedAt: "desc" },
    take: 10,
    include: {
      session: {
        select: {
          id: true,
          startTime: true,
          topic: true,
          group: { select: { title: true } },
        },
      },
      supervisor: { select: { user: { select: { name: true } } } },
    },
  });

  const supervisorReviews: SupervisorReview[] = attendanceReviews.map((r) => ({
    id: r.id,
    sessionId: r.session.id,
    groupName: r.session.group.title,
    topic: r.session.topic,
    date: r.session.startTime.toISOString(),
    status: r.status as AttendanceStatus,
    notes: r.notes,
    supervisorName: r.supervisor?.user.name ?? null,
    reviewedAt: r.reviewedAt?.toISOString() ?? "",
  }));

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

  let financesData: TutorFinancesInput | undefined;
  try {
    const fetched = await getTutorFinancialSummary(id);
    financesData = fetched.data;
  } catch {
    financesData = undefined;
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
    supervisorReviews,
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

  return (
    <TutorProfileClient
      tutor={transformed}
      academyId={academyId}
      finances={financesData}
    />
  );
}
