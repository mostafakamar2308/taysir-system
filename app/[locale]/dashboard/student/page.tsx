import { notFound, redirect } from "next/navigation";
import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { StudentDashboardClient } from "@/components/dashboard/student/viewer"; // تأكد من المسار الصحيح
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import { SubscriptionStatus } from "@/types/subscription";

export default async function StudentDashboardPage() {
  const currentUser = await user();
  if (!currentUser || !currentUser.studentId) redirect("/login");

  const studentId = currentUser.studentId;

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          name: true,
          timezone: true,
          preferredLanguage: true,
          imageUrl: true,
        },
      },
      tutor: { include: { user: { select: { name: true } } } },
      plan: { include: { currency: { select: { code: true, symbol: true } } } },
      subscriptions: {
        where: { status: SubscriptionStatus.active },
        orderBy: { startDate: "desc" },
        take: 1,
        include: {
          plan: {
            include: { currency: { select: { code: true, symbol: true } } },
          },
          payments: { include: { currency: { select: { code: true } } } },
        },
      },
      sessions: {
        include: {
          tutor: { include: { user: { select: { name: true } } } },
          sessionReport: true,
          attendance: true,
        },
        orderBy: { startTime: "desc" },
      },
      academy: {
        include: { defaultCurrency: true }, // الإصلاح: استخدام include بدلاً من select الفارغ
      },
    },
  });

  if (!student) notFound();

  const now = dayjs.utc().toDate();
  const startOfMonth = dayjs.utc().startOf("month").toDate();
  const endOfMonth = dayjs.utc().endOf("month").toDate();

  // الجلسة القادمة
  const nextSession =
    student.sessions
      .filter((s) => s.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] ?? null;

  // آخر تقرير لجلسة
  const lastReportSession =
    student.sessions
      .filter((s) => s.sessionReport)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0] ?? null;

  // التحليلات الشهرية
  const allMonthlySessions = student.sessions.filter(
    (s) => s.startTime >= startOfMonth && s.startTime <= endOfMonth,
  );
  const totalMonthlySessions = allMonthlySessions.length;
  const remainingMonthlySessions = allMonthlySessions.filter(
    (s) => s.startTime > now,
  ).length;
  const renewalDate = student.subscriptions[0]?.endDate ?? null;

  // تجهيز الكائن المُرسَل إلى العميل مع ضمان عدم وجود قيم null غير متوقعة
  const props = {
    student: {
      id: student.id,
      name: student.user.name ?? "طالب",
      timezone: student.user.timezone,
      imageUrl: student.user.imageUrl,
      tutorName: student.tutor?.user.name ?? null, // يمكن أن يكون null
      plan: student.plan
        ? {
            title: student.plan.title,
            sessionsPerWeek: student.plan.sessionsPerWeek,
            price: student.plan.price,
            currency: student.plan.currency.code,
            billingPeriod: student.plan.billingPeriod,
          }
        : null,
    },
    nextSession: nextSession
      ? {
          id: nextSession.id,
          startTime: nextSession.startTime.toISOString(),
          endTime: nextSession.endTime.toISOString(),
          tutorName: nextSession.tutor.user.name ?? "معلم", // ضمان string
          zoomJoinUrl: nextSession.zoomJoinUrl ?? null,
          topic: nextSession.topic,
        }
      : null,
    monthlyAnalytics: {
      totalMonthlySessions,
      remainingMonthlySessions,
      renewalDate: renewalDate?.toISOString() ?? null,
    },
    lastReport: lastReportSession
      ? {
          sessionDate: lastReportSession.startTime.toISOString(),
          topic: lastReportSession.topic,
          report: {
            rating: lastReportSession.sessionReport!.rating,
            outcomes: lastReportSession.sessionReport!.outcomes,
            strengths: lastReportSession.sessionReport!.strengths,
            weaknesses: lastReportSession.sessionReport!.weaknesses,
            nextGoals: lastReportSession.sessionReport!.nextGoals,
          },
        }
      : null,
    sessions: student.sessions.map((s) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      topic: s.topic,
      tutorName: s.tutor.user.name ?? "معلم", // ضمان string
      status: getSessionStatus(s),
      attendance: s.attendance
        ? { studentStatus: s.attendance.studentAttendanceStatus }
        : null,
      hasReport: !!s.sessionReport,
      reportId: s.sessionReport?.id || null,
    })),
    reports: student.sessions
      .filter((s) => s.sessionReport)
      .map((s) => ({
        sessionDate: s.startTime.toISOString(),
        topic: s.topic,
        rating: s.sessionReport!.rating,
        outcomes: s.sessionReport!.outcomes,
        strengths: s.sessionReport!.strengths,
        weaknesses: s.sessionReport!.weaknesses,
        nextGoals: s.sessionReport!.nextGoals,
      })),
    activeSubscription: student.subscriptions[0]
      ? {
          id: student.subscriptions[0].id,
          planTitle: student.subscriptions[0].plan.title,
          planSessionsPerWeek: student.subscriptions[0].plan.sessionsPerWeek,
          planPrice: student.subscriptions[0].plan.price,
          planCurrency: student.subscriptions[0].plan.currency.code,
          startDate: student.subscriptions[0].startDate.toISOString(),
          endDate: student.subscriptions[0].endDate?.toISOString() ?? null,
          payments: student.subscriptions[0].payments.map((p) => ({
            amount: p.amount,
            currency: p.currency.code,
            status: p.status,
            date: p.dueDate.toISOString(),
            method: p.method,
          })),
        }
      : null,
    // defaultCurrency يجب ألا يكون null، وإلا نقدم قيمة افتراضية
    defaultCurrency: student.academy.defaultCurrency ?? {
      code: "USD",
      symbol: "$",
      name: "US Dollar",
    },
  };

  return <StudentDashboardClient {...props} />;
}
