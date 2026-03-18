import db from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import StudentProfileClient from "@/components/dashboard/studentProfile/viewer";
import { user } from "@/lib/auth";
import { getSessionStatus } from "@/lib/session";
import { StudentProfile } from "@/types/studentProfile";
import dayjs from "@/lib/dayjs";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await user();
  if (!currentUser) redirect("/login");

  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const startOfMonth = dayjs.utc().startOf("month").toDate();

  const student = await db.student.findUnique({
    where: { id },
    include: {
      tutor: { include: { user: true } },
      plan: {
        include: {
          currency: true,
        },
      },
      studentAvailabilities: true,
      notes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        include: {
          plan: { include: { currency: true } },
          payments: true,
        },
        orderBy: { startDate: "desc" },
      },
      payments: {
        include: {
          currency: true,
        },
      },
      sessions: {
        where: {
          startTime: { gte: startOfMonth },
        },
        include: {
          tutor: { include: { user: true } },
          attendance: true,
          sessionReport: true,
        },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!student) notFound();

  const transformed: StudentProfile = {
    id: student.id,
    name: student.name,
    email: student.email,
    age: student.age,
    phone: student.phone,
    country: student.country,
    timezone: student.timezone,
    status: student.status,
    startDate: student.startDate.toISOString(),
    renewalDate: student.renewalDate?.toISOString() ?? null,
    source: student.source,
    currentProgram: student.currentProgram,
    emergencyContactName: student.emergencyContactName,
    emergencyContactPhone: student.emergencyContactPhone,
    preferredLanguage: student.preferredLanguage,
    imageUrl: student.imageUrl,
    tutorId: student.tutorId,
    tutorName: student.tutor?.user.name ?? null,
    planId: student.planId,
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
    availabilities: student.studentAvailabilities.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: a.endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    })),
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
      autoRenew: sub.autoRenew,
      payments: sub.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        date: p.date.toISOString(),
        status: p.status,
      })),
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
      date: p.date.toISOString(),
      dueDate: p.dueDate?.toISOString() ?? null,
      description: p.description,
      studentId: p.studentId,
      planId: p.planId,
      invoiceUrl: p.invoiceUrl,
    })),
    sessions: student.sessions.map((s) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      durationMinutes: s.durationMinutes,
      status: getSessionStatus(s),
      topic: s.topic,
      notes: s.notes,
      studentId: s.studentId,
      studentName: student.name, // or fetch student name if needed
      tutorId: s.tutorId,
      tutorName: s.tutor.user.name,
      attendance: s.attendance
        ? {
            id: s.attendance.id,
            status: s.attendance.studentAttendanceStatus,
            reason: s.attendance.reason,
          }
        : undefined,
      report: s.sessionReport
        ? {
            id: s.sessionReport.id,
            rating: s.sessionReport.rating,
            outcomes: s.sessionReport.outcomes,
            strengths: s.sessionReport.strengths,
            weaknesses: s.sessionReport.weaknesses,
            nextGoals: s.sessionReport.nextGoals,
            comments: s.sessionReport.comments,
          }
        : null,
      recurringPatternId: s.recurringPatternId,
    })),
  };

  const plans = await db.plan.findMany({
    where: {
      academyId: currentUser.academyId,
    },
  });

  const tutors = await db.tutor.findMany({
    where: {
      academyId: currentUser.academyId,
    },
    include: {
      user: true,
    },
  });
  const currencies = await db.currency.findMany({});

  return (
    <StudentProfileClient
      tutors={tutors.map((t) => ({ id: t.id, name: t.user.name }))}
      currencies={currencies}
      plans={plans}
      student={transformed}
    />
  );
}
