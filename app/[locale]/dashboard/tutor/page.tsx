import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { PaymentStatus } from "@/types/payment";
import DashboardClient from "@/components/tutor/dashboard/viewer";
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import { AttendanceStatus } from "@/types/session";

// New return type for the client
export interface SessionParticipantSummary {
  id: number; // participant id
  studentId: number;
  studentName: string;
  studentPhone?: string | null;
  attendanceStatus: number | null; // null = not yet marked
  hasReport: boolean;
}

export interface SessionSummary {
  id: number;
  startTime: string;
  endTime: string;
  topic: string | null;
  status: number;
  participants: SessionParticipantSummary[];
  hasAnyAttendanceMissing: boolean; // any participant not yet marked
  hasAnyReportMissing: boolean; // any participant attended/late but no report
  meetingLink?: string | null;
}

export default async function TutorDashboardPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Tutor || !currentUser.id) {
    redirect("/login");
  }
  const userId = currentUser.id;

  const tutor = await db.tutor.findUnique({
    where: { userId },
    include: { currency: true },
  });

  if (!tutor) redirect("/login");
  const tutorId = tutor.id;

  const now = dayjs.utc();
  const todayStart = now.startOf("day").toDate();
  const todayEnd = now.endOf("day").toDate();

  // Fetch all sessions for this tutor with participants and their reports
  const sessions = await db.session.findMany({
    where: {
      tutorId,
      startTime: {
        lte: now.endOf("month").toDate(),
      },
      cancelledBy: null,
    },
    include: {
      participants: {
        include: {
          student: {
            select: { id: true, user: { select: { name: true, phone: true } } },
          },
          report: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  // Helper to map raw session to SessionSummary
  const toSessionSummary = (s: (typeof sessions)[0]): SessionSummary => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    topic: s.topic,
    status: getSessionStatus(s),
    participants: s.participants.map((p) => ({
      id: p.id,
      studentId: p.studentId,
      studentName: p.student.user.name || "",
      studentPhone: p.student.user.phone,
      attendanceStatus: p.studentAttendanceStatus,
      hasReport: !!p.report,
    })),
    hasAnyAttendanceMissing: s.participants.some(
      (p) => p.studentAttendanceStatus === null,
    ),
    hasAnyReportMissing: s.participants.some(
      (p) =>
        p.studentAttendanceStatus !== null &&
        [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
          p.studentAttendanceStatus,
        ) &&
        !p.report,
    ),
    meetingLink: s.zoomStartUrl || null,
  });

  // All sessions as summaries
  const allSummaries = sessions.map(toSessionSummary);

  // Filter categories
  const todaySessions = allSummaries.filter(
    (s) =>
      new Date(s.startTime) >= todayStart && new Date(s.startTime) <= todayEnd,
  );
  const upcomingSessions = allSummaries.filter(
    (s) => new Date(s.startTime) > todayEnd,
  );

  const nowDate = now.toDate();
  // Pending attendance: sessions that have started (or completed) and any participant missing attendance
  const pendingAttendance = allSummaries.filter(
    (s) => new Date(s.startTime) <= nowDate && s.hasAnyAttendanceMissing,
  );
  // Pending reports: sessions that have started and any participant attended/late but report missing
  const pendingReports = allSummaries.filter(
    (s) => new Date(s.startTime) <= nowDate && s.hasAnyReportMissing,
  );

  // Financial summary – differentiate private vs group sessions
  const startOfMonth = now.startOf("month").toDate();
  const endOfMonth = now.endOf("month").toDate();

  const monthSessions = sessions.filter(
    (s) => s.startTime >= startOfMonth && s.startTime <= endOfMonth,
  );

  let totalPrivateMinutes = 0;
  let totalGroupMinutes = 0;
  const completedMonthSessions = monthSessions.filter(
    (s) => s.cancelledBy === null,
  );

  for (const s of completedMonthSessions) {
    const participantCount = s.participants.length;
    if (participantCount <= 1) {
      totalPrivateMinutes += s.durationMinutes;
    } else {
      totalGroupMinutes += s.durationMinutes;
    }
  }

  const expectedEarnings =
    (totalPrivateMinutes / 60) * tutor.privatePricePerHour +
    (totalGroupMinutes / 60) * tutor.groupPricePerHour;

  // Paid expenses this month
  const paidExpenses = await db.expense.findMany({
    where: {
      tutorId,
      salaryMonth: now.format("YYYY-MM"),
      status: PaymentStatus.PAID,
    },
  });
  const paidThisMonth = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingEarnings = expectedEarnings - paidThisMonth;

  return (
    <DashboardClient
      todaySessions={todaySessions}
      upcomingSessions={upcomingSessions}
      pendingAttendance={pendingAttendance}
      pendingReports={pendingReports}
      financialSummary={{
        totalSessions: monthSessions.length,
        expectedEarnings,
        paidThisMonth,
        remainingEarnings,
        currency: tutor.currency?.code || "SAR",
      }}
      zoomEnabled={!!tutor.zoomAuthenticated}
    />
  );
}
