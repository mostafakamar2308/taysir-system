import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { SessionStatus } from "@/types/session";
import { PaymentStatus } from "@/types/payment";
import DashboardClient from "@/components/tutor/dashboard/viewer";
import dayjs from "@/lib/dayjs";

export default async function TutorDashboardPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Tutor || !currentUser.id) {
    redirect("/login");
  }
  const userId = currentUser.id;

  const tutor = await db.tutor.findUnique({
    where: {
      userId,
    },
    include: {
      currency: true,
    },
  });

  if (!tutor) redirect("/login");
  const tutorId = tutor.id;
  console.log(tutor.id);

  const now = dayjs.utc();
  const todayStart = now.startOf("day").toDate();
  const todayEnd = now.endOf("day").toDate();

  // Fetch all sessions for this tutor
  const sessions = await db.session.findMany({
    where: { tutorId },
    include: {
      student: { select: { id: true, name: true, phone: true } },
      attendance: true,
      sessionReport: true,
    },
    orderBy: { startTime: "asc" },
  });

  // Separate into today, upcoming, and pending
  const todaySessions = sessions.filter(
    (s) => s.startTime >= todayStart && s.startTime <= todayEnd,
  );
  const upcomingSessions = sessions.filter(
    (s) => s.startTime > todayEnd && s.status === SessionStatus.SCHEDULED,
  );
  const pendingAttendance = sessions.filter(
    (s) =>
      s.startTime <= now.toDate() &&
      s.status === SessionStatus.COMPLETED &&
      !s.attendance,
  );
  const pendingReports = sessions.filter(
    (s) =>
      s.startTime <= now.toDate() &&
      s.status === SessionStatus.COMPLETED &&
      !s.sessionReport,
  );

  // Financial summary for the current month
  const startOfMonth = now.startOf("month").toDate();
  const endOfMonth = now.endOf("month").toDate();

  const monthSessions = sessions.filter(
    (s) => s.startTime >= startOfMonth && s.startTime <= endOfMonth,
  );
  console.log({ monthSessions });

  const totalSessionsThisMonth = monthSessions.length;
  const expectedEarnings =
    totalSessionsThisMonth * (tutor?.pricePerSession || 0);

  // Get already paid expenses for this tutor this month
  const paidExpenses = await db.expense.findMany({
    where: {
      tutorId,
      salaryMonth: now.format("YYYY-MM"),
      status: PaymentStatus.PAID,
    },
  });
  const paidThisMonth = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingEarnings = expectedEarnings - paidThisMonth;

  const formatSession = (s: (typeof sessions)[0]) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    topic: s.topic,
    studentId: s.studentId,
    studentName: s.student.name,
    studentPhone: s.student.phone,
    status: s.status,
    hasAttendance: !!s.attendance,
    hasReport: !!s.sessionReport,
  });

  return (
    <DashboardClient
      todaySessions={todaySessions.map(formatSession)}
      upcomingSessions={upcomingSessions.map(formatSession)}
      pendingAttendance={pendingAttendance.map(formatSession)}
      pendingReports={pendingReports.map(formatSession)}
      financialSummary={{
        totalSessions: totalSessionsThisMonth,
        expectedEarnings,
        paidThisMonth,
        remainingEarnings,
        currency: tutor?.currency?.code || "SAR",
      }}
    />
  );
}
