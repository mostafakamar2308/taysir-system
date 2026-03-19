import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { StudentStatus } from "@/types/student";
import { SessionStatus, AttendanceStatus } from "@/types/session";
import { PaymentStatus } from "@/types/payment";
import DashboardClient from "@/components/dashboard/overview/viewer";
import { SubscriptionStatus } from "@/types/subscription";

export default async function DashboardPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;

  const now = dayjs.utc();
  const today = now.startOf("day");
  const startOfWeek = now.startOf("week");
  const endOfWeek = now.endOf("week");
  const startOfMonth = now.startOf("month");
  const endOfMonth = now.endOf("month");
  const startOfPrevMonth = now.subtract(1, "month").startOf("month");
  const endOfPrevMonth = now.subtract(1, "month").endOf("month");

  // ----- Basic stats -----
  const [
    totalStudents,
    subscribedStudents,
    trialStudents,
    leadStudents,
    newStudentsThisWeek,
    activeTutors,
    totalSupervisors,
  ] = await Promise.all([
    db.student.count({ where: { academyId } }),
    db.student.count({
      where: { academyId, status: StudentStatus.subscribed },
    }),
    db.student.count({ where: { academyId, status: StudentStatus.trial } }),
    db.student.count({ where: { academyId, status: StudentStatus.lead } }),
    db.student.count({
      where: {
        academyId,
        createdAt: { gte: startOfWeek.toDate(), lte: endOfWeek.toDate() },
      },
    }),
    db.tutor.count({ where: { academyId, active: true } }),
    db.supervisor.count({ where: { academyId } }),
  ]);

  // ----- Revenue this month vs previous -----
  const [revenueThisMonth, revenuePrevMonth] = await Promise.all([
    db.revenue.aggregate({
      where: {
        student: { academyId },
        date: { gte: startOfMonth.toDate(), lte: endOfMonth.toDate() },
        status: PaymentStatus.PAID,
      },
      _sum: { amount: true },
    }),
    db.revenue.aggregate({
      where: {
        student: { academyId },
        date: { gte: startOfPrevMonth.toDate(), lte: endOfPrevMonth.toDate() },
        status: PaymentStatus.PAID,
      },
      _sum: { amount: true },
    }),
  ]);

  // ----- LTV / CAC (simplified) -----
  // Total revenue from all paid revenues
  const totalRevenue = await db.revenue.aggregate({
    where: { student: { academyId }, status: PaymentStatus.PAID },
    _sum: { amount: true },
  });
  // Total students ever
  const totalEverStudents = await db.student.count({ where: { academyId } });
  // Marketing expenses (costCenter = "تسويق")
  const marketingExpenses = await db.expense.aggregate({
    where: { academyId, costCenter: "تسويق", status: PaymentStatus.PAID },
    _sum: { amount: true },
  });
  const ltv =
    totalEverStudents > 0
      ? (totalRevenue._sum.amount || 0) / totalEverStudents
      : 0;
  const cac = marketingExpenses._sum.amount || 0;

  // ----- Conversion rates -----
  // Lead to trial: count students who were ever lead and then became trial/subscribed (simplified: we can use status history, but not available; approximate using those with status > lead)
  const leadToTrialCount = await db.student.count({
    where: {
      academyId,
      status: { in: [StudentStatus.trial, StudentStatus.subscribed] },
    },
  });
  const leadCount = leadStudents + leadToTrialCount; // total leads ever (approximate)
  const leadToTrialRate =
    leadCount > 0 ? (leadToTrialCount / leadCount) * 100 : 0;

  // Trial to subscribed
  const trialToSubscribedCount = await db.student.count({
    where: { academyId, status: StudentStatus.subscribed },
  });
  const trialCountEver = await db.student.count({
    where: {
      academyId,
      status: { in: [StudentStatus.trial, StudentStatus.subscribed] },
    },
  });
  const trialToSubscribedRate =
    trialCountEver > 0 ? (trialToSubscribedCount / trialCountEver) * 100 : 0;

  // ----- Danger signs (students at risk) -----
  // Use the same criteria as in student profile warnings: late payment, last session absent unexcused, attendance <80%
  const students = await db.student.findMany({
    where: { academyId, status: StudentStatus.subscribed },
    include: {
      sessions: {
        where: { status: SessionStatus.COMPLETED },
        include: { attendance: true },
        orderBy: { startTime: "desc" },
        take: 1, // last session
      },
      subscriptions: {
        where: { status: 0 }, // active
        include: { plan: true },
      },
    },
  });

  const atRiskStudents = students
    .filter((student) => {
      const lastSession = student.sessions[0];
      const lastSessionAbsentUnexcused =
        lastSession?.attendance?.studentAttendanceStatus ===
        AttendanceStatus.ABSENT_UNEXCUSED;
      const hasActiveSubscription = student.subscriptions.length > 0;
      const subscription = student.subscriptions[0];
      const daysUntilRenewal = subscription?.endDate
        ? dayjs(subscription.endDate).diff(now, "day")
        : 30;
      const latePayment = hasActiveSubscription && daysUntilRenewal < 0; // expired
      const nearRenewal =
        hasActiveSubscription && daysUntilRenewal >= 0 && daysUntilRenewal <= 7;
      return lastSessionAbsentUnexcused || latePayment || nearRenewal;
    })
    .map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      reason: s.subscriptions[0]?.endDate
        ? dayjs(s.subscriptions[0].endDate).isBefore(now)
          ? "منتهي الاشتراك"
          : "اقتراب نهاية الاشتراك"
        : "غياب بدون عذر",
    }));

  // ----- Attendance Sheet: today's sessions with missing attendance -----
  const todaySessions = await db.session.findMany({
    where: {
      academyId,
      startTime: { gte: today.toDate(), lt: today.add(1, "day").toDate() },
      attendance: null, // no attendance recorded
    },
    include: {
      student: { select: { id: true, name: true, phone: true } },
    },
  });

  // ----- Reconciliation: Late Payments & Near-end Subscriptions -----
  const activeSubscriptions = await db.subscription.findMany({
    where: {
      student: { academyId },
      status: SubscriptionStatus.active,
    },
    include: {
      student: { select: { id: true, name: true, phone: true } },
      plan: { select: { title: true, price: true } },
    },
  });

  const latePayments = activeSubscriptions
    .filter((sub) => {
      // If endDate is past, payment is late
      if (sub.endDate && dayjs(sub.endDate).isBefore(now, "day")) return true;
      // If no endDate, assume 30 days from startDate
      const defaultEnd = dayjs(sub.startDate).add(30, "day");
      return defaultEnd.isBefore(now, "day");
    })
    .map((sub) => ({
      id: sub.studentId,
      studentName: sub.student.name,
      phone: sub.student.phone,
      planTitle: sub.plan.title,
      amountDue: sub.plan.price,
      daysOverdue: sub.endDate
        ? Math.abs(dayjs(sub.endDate).diff(now, "day"))
        : Math.abs(dayjs(sub.startDate).add(30, "day").diff(now, "day")),
    }));

  const nearEndSubscriptions = activeSubscriptions
    .filter((sub) => {
      const end = sub.endDate || dayjs(sub.startDate).add(30, "day");
      const daysLeft = dayjs(end).diff(now, "day");
      return daysLeft >= 0 && daysLeft <= 7;
    })
    .map((sub) => ({
      id: sub.studentId,
      studentName: sub.student.name,
      phone: sub.student.phone,
      planTitle: sub.plan.title,
      endDate: (
        dayjs(sub.endDate) || dayjs(sub.startDate).add(30, "day")
      ).format("YYYY-MM-DD"),
      daysLeft: dayjs(sub.endDate || dayjs(sub.startDate).add(30, "day")).diff(
        now,
        "day",
      ),
    }));

  // ----- Reports Sheet: today's sessions without a session report -----
  const sessionsWithoutReport = await db.session.findMany({
    where: {
      academyId,
      startTime: { gte: today.toDate(), lt: today.add(1, "day").toDate() },
      sessionReport: null,
    },
    include: {
      student: { select: { name: true } },
      tutor: { include: { user: { select: { name: true, phone: true } } } },
    },
  });

  return (
    <DashboardClient
      stats={{
        totalStudents,
        subscribedStudents,
        trialStudents,
        leadStudents,
        newStudentsThisWeek,
        activeTutors,
        totalSupervisors,
        revenueThisMonth: revenueThisMonth._sum.amount || 0,
        revenuePrevMonth: revenuePrevMonth._sum.amount || 0,
        ltv,
        cac,
        leadToTrialRate,
        trialToSubscribedRate,
      }}
      atRiskStudents={atRiskStudents}
      attendanceSheet={todaySessions.map((s) => ({
        sessionId: s.id,
        studentId: s.student.id,
        studentName: s.student.name,
        studentPhone: s.student.phone,
        startTime: s.startTime.toISOString(),
      }))}
      latePayments={latePayments}
      nearEndSubscriptions={nearEndSubscriptions}
      reportsSheet={sessionsWithoutReport.map((s) => ({
        sessionId: s.id,
        tutorId: s.tutor.id,
        tutorName: s.tutor.user.name || "",
        tutorPhone: s.tutor.user.phone,
        studentName: s.student.name,
        startTime: s.startTime.toISOString(),
      }))}
      academyId={academyId}
    />
  );
}
