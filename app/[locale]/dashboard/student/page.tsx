import { notFound, redirect } from "next/navigation";
import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { StudentDashboardClient } from "@/components/dashboard/student/viewer";
import dayjs from "@/lib/dayjs";
import { SubscriptionStatus } from "@/types/subscription";
import { computeHomeworkData } from "@/lib/homework";

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
      groupMemberships: {
        where: { active: true },
        include: {
          group: {
            include: {
              currentTutor: { include: { user: { select: { name: true } } } },
            },
          },
          subscriptions: {
            where: { status: SubscriptionStatus.active },
            orderBy: { startDate: "desc" },
            take: 1,
            include: {
              currency: { select: { code: true } },
              plan: {
                include: { currency: { select: { code: true, symbol: true } } },
              },
              payments: { include: { currency: { select: { code: true } } } },
            },
          },
        },
      },
      sessionParticipants: {
        include: {
          session: {
            include: {
              tutor: { include: { user: { select: { name: true } } } },
              assignment: {
                include: {
                  solutions: true,
                },
              },
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

  const activeMembership = student.groupMemberships[0];
  const activeSubscription = activeMembership?.subscriptions[0] ?? null;
  const currentPlan = activeSubscription?.plan ?? null;

  const renewalDate = activeSubscription?.endDate ?? null;

  const { pendingAssignments, lastAssignmentData, sessionsWithAssignment } =
    computeHomeworkData(student.sessionParticipants);

  // Build props for client
  const props = {
    student: {
      id: student.id,
      name: student.user.name ?? "طالب",
      timezone: student.user.timezone,
      imageUrl: student.user.imageUrl,
      tutorName: activeMembership?.group.currentTutor.user.name ?? null,
      plan: currentPlan
        ? {
            title: currentPlan.title,
            sessionsPerWeek: currentPlan.sessionCount,
            price: currentPlan.price,
            currency: currentPlan.currency.code,
            billingPeriod: currentPlan.billingPeriod,
          }
        : null,
    },
    nextSession: nextSession
      ? {
          id: nextSession.id,
          startTime: nextSession.startTime.toISOString(),
          endTime: dayjs
            .utc(nextSession.startTime)
            .add(nextSession.durationMinutes, "minute")
            .toISOString(),
          tutorName: nextSession.tutor.user.name ?? "معلم",
          zoomJoinUrl: nextSession.zoomUrl ?? null,
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
    sessions: sessionsWithAssignment,
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
    activeSubscription: activeSubscription
      ? {
          id: activeSubscription.id,
          planTitle: activeSubscription.plan?.title ?? "—",
          planSessionsPerWeek: activeSubscription.plan?.sessionCount ?? 0,
          planPrice: activeSubscription.price,
          planCurrency: activeSubscription.currency.code,
          startDate: activeSubscription.startDate.toISOString(),
          endDate: activeSubscription.endDate?.toISOString() ?? null,
          payments: activeSubscription.payments.map((p) => ({
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
    pendingAssignmentsCount: pendingAssignments.length,
    lastAssignment: lastAssignmentData,
  };

  return <StudentDashboardClient {...props} />;
}
