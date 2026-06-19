import db from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import StudentProfileClient from "@/components/dashboard/studentProfile/viewer";
import { user } from "@/lib/auth";
import { getSessionStatus } from "@/lib/session";
import { StudentProfile, SessionRecord } from "@/types/studentProfile";
import dayjs from "@/lib/dayjs";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academy = await db.academy.findUnique({
    where: { id: currentUser.academyId },
    include: { defaultCurrency: true },
  });
  if (!academy) redirect("/login");

  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const startOfMonth = dayjs.utc().startOf("month").toDate();
  const endOfMonth = dayjs.utc().endOf("month").toDate();

  const student = await db.student.findUnique({
    where: { id },
    include: {
      tutor: { include: { user: true } },
      user: true,
      plan: { include: { currency: true } },
      studentAvailabilities: true,
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      subscriptions: {
        include: { plan: { include: { currency: true } }, payments: true },
        orderBy: { startDate: "desc" },
      },
      payments: { include: { currency: true } },
      // NEW: fetch sessions via participants
      sessionParticipants: {
        where: {
          session: {
            startTime: { gte: startOfMonth, lte: endOfMonth },
          },
        },
        include: {
          session: {
            include: {
              tutor: { include: { user: true } },
            },
          },
          report: true,
        },
        orderBy: { session: { startTime: "desc" } },
      },
    },
  });

  if (!student) notFound();

  // Transform sessions using participants
  const sessions: SessionRecord[] = student.sessionParticipants.map((p) => ({
    id: p.session.id,
    startTime: p.session.startTime.toISOString(),
    endTime: p.session.endTime.toISOString(),
    durationMinutes: p.session.durationMinutes,
    status: getSessionStatus(p.session),
    topic: p.session.topic,
    notes: p.session.notes,
    tutorId: p.session.tutorId,
    tutorName: p.session.tutor.user.name ?? "",
    attendance: {
      id: p.id,
      status: p.studentAttendanceStatus,
      reason: null, // use p.reason if field exists
    },
    report: p.report
      ? {
          id: p.report.id,
          rating: p.report.rating,
          outcomes: p.report.outcomes,
          strengths: p.report.strengths,
          weaknesses: p.report.weaknesses,
          nextGoals: p.report.nextGoals,
          comments: p.report.comments,
        }
      : null,
  }));

  const transformed: StudentProfile = {
    id: student.id,
    name: student.user.name || "",
    email: student.user.email || "",
    age: student.age,
    phone: student.user.phone || "",
    country: student.country,
    timezone: student.user.timezone,
    status: student.status,
    source: student.source,
    preferredLanguage: student.user.preferredLanguage,
    tutorId: student.tutorId,
    tutorName: student.tutor?.user.name ?? null,
    planId: student.planId,
    sessionsBalance: student.sessionsBalance,
    plan: student.plan
      ? {
          id: student.plan.id,
          title: student.plan.title,
          sessionsPerWeek: student.plan.sessionsPerWeek,
          price: student.plan.price,
          billingPeriod: student.plan.billingPeriod,
          currency: student.plan.currency.code,
        }
      : null,
    academyId: student.academyId,
    subscriptions: student.subscriptions.map((sub) => ({
      id: sub.id,
      planId: sub.planId,
      planTitle: sub.plan.title,
      planSessionsPerWeek: sub.plan.sessionsPerWeek,
      planPrice: sub.plan.price,
      planCurrency: sub.plan.currency.code,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate?.toISOString() ?? null,
      status: sub.status,
      payments: sub.payments.map((pay) => ({
        id: pay.id,
        amount: pay.amount,
        date: pay.dueDate.toISOString(),
        status: pay.status,
      })),
      pricePerSession: sub.plan.price / (sub.plan.sessionsPerWeek * 4),
    })),
    notes: student.notes.map((n) => ({
      id: n.id,
      content: n.content,
      authorName: n.author.name ?? "مستخدم",
      createdAt: n.createdAt.toISOString(),
    })),
    payments: student.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency.code,
      status: p.status,
      method: p.method,
      date: p.dueDate.toISOString(),
      dueDate: p.dueDate?.toISOString() ?? null,
      description: p.description,
      studentId: p.studentId,
      planId: p.planId,
      invoiceUrl: p.invoiceUrl,
    })),
    sessions,
  };

  const plans = await db.plan.findMany({
    where: { academyId: currentUser.academyId },
    include: { currency: { select: { code: true } } },
  });

  const tutors = await db.tutor.findMany({
    where: { academyId: currentUser.academyId },
    include: { user: true },
  });

  const currencyRates = await db.academyCurrencyRate.findMany({
    where: { academyId: academy.id },
    include: { currency: true },
  });
  const rateMap = Object.fromEntries(
    currencyRates.map((r) => [r.currency.code, r.rate]),
  );

  return (
    <StudentProfileClient
      tutors={tutors.map((t) => ({ id: t.id, name: t.user.name }))}
      plans={plans.map((p) => ({ ...p, currency: p.currency.code }))}
      defaultCurrency={academy.defaultCurrency!}
      student={transformed}
      currencyRates={rateMap}
      academyId={currentUser.academyId!}
    />
  );
}
