import { notFound, redirect } from "next/navigation";
import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { StudentDashboardClient } from "@/components/dashboard/student/viewer";
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
      sessionParticipants: {
        include: {
          session: {
            include: {
              tutor: { include: { user: { select: { name: true } } } },
            },
          },
          report: true,
        },
        orderBy: { session: { startTime: "desc" } },
      },
      academy: {
        include: { defaultCurrency: true },
      },
    },
  });

  if (!student) notFound();

  const now = dayjs.utc().toDate();
  const startOfMonth = dayjs.utc().startOf("month").toDate();
  const endOfMonth = dayjs.utc().endOf("month").toDate();

  // Next session – earliest session startTime > now
  const futureParticipants = student.sessionParticipants
    .filter((p) => p.session.startTime > now)
    .sort(
      (a, b) => a.session.startTime.getTime() - b.session.startTime.getTime(),
    );
  const nextParticipant = futureParticipants[0] ?? null;
  const nextSession = nextParticipant?.session ?? null;

  // Last report – most recent session with a report
  const lastReportParticipant =
    student.sessionParticipants
      .filter((p) => p.report)
      .sort(
        (a, b) => b.session.startTime.getTime() - a.session.startTime.getTime(),
      )[0] ?? null;

  // Monthly sessions: unique sessions within month
  const monthParticipants = student.sessionParticipants.filter(
    (p) =>
      p.session.startTime >= startOfMonth && p.session.startTime <= endOfMonth,
  );
  const uniqueMonthSessions = new Set(
    monthParticipants.map((p) => p.session.id),
  );
  const totalMonthlySessions = uniqueMonthSessions.size;
  const remainingMonthlySessions = monthParticipants.filter(
    (p) => p.session.startTime > now,
  ).length;

  const renewalDate = student.subscriptions[0]?.endDate ?? null;

  // Build props for client
  const props = {
    student: {
      id: student.id,
      name: student.user.name ?? "طالب",
      timezone: student.user.timezone,
      imageUrl: student.user.imageUrl,
      tutorName: student.tutor?.user.name ?? null,
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
          tutorName: nextSession.tutor.user.name ?? "معلم",
          zoomJoinUrl: nextSession.zoomJoinUrl ?? null,
          topic: nextSession.topic,
        }
      : null,
    monthlyAnalytics: {
      totalMonthlySessions,
      remainingMonthlySessions,
      renewalDate: renewalDate?.toISOString() ?? null,
    },
    lastReport: lastReportParticipant
      ? {
          sessionDate: lastReportParticipant.session.startTime.toISOString(),
          topic: lastReportParticipant.session.topic,
          report: {
            rating: lastReportParticipant.report!.rating,
            outcomes: lastReportParticipant.report!.outcomes,
            strengths: lastReportParticipant.report!.strengths,
            weaknesses: lastReportParticipant.report!.weaknesses,
            nextGoals: lastReportParticipant.report!.nextGoals,
          },
        }
      : null,
    sessions: student.sessionParticipants.map((p) => ({
      id: p.session.id,
      participantId: p.id,
      startTime: p.session.startTime.toISOString(),
      endTime: p.session.endTime.toISOString(),
      topic: p.session.topic,
      tutorName: p.session.tutor.user.name ?? "معلم",
      status: getSessionStatus(p.session),
      attendance: p.studentAttendanceStatus,
      hasReport: !!p.report,
    })),
    reports: student.sessionParticipants
      .filter((p) => p.report)
      .map((p) => ({
        sessionDate: p.session.startTime.toISOString(),
        topic: p.session.topic,
        rating: p.report!.rating,
        outcomes: p.report!.outcomes,
        strengths: p.report!.strengths,
        weaknesses: p.report!.weaknesses,
        nextGoals: p.report!.nextGoals,
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
    defaultCurrency: student.academy.defaultCurrency ?? {
      code: "EGP",
      symbol: "L.E",
      name: "جنيه مصري",
    },
  };

  return <StudentDashboardClient {...props} />;
}
