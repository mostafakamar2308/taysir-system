import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import TutorProfileClient from "@/components/dashboard/tutorProfile/viewer";
import type {
  TutorProfile,
  AssignedStudent,
  TutorSession,
  TutorNote,
  TutorAvailability,
  TutorPayment,
} from "@/types/tutor";
import { getSessionStatus } from "@/lib/session";
import dayjs from "@/lib/dayjs";
import { AttendanceStatus } from "@/types/session";

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const startOfMonth = dayjs.utc().startOf("month").toDate();
  const endOfMonth = dayjs.utc().endOf("month").toDate();
  const startOfLastMonth = dayjs
    .utc()
    .subtract(1, "month")
    .startOf("month")
    .toDate();
  const endOfLastMonth = dayjs
    .utc()
    .subtract(1, "month")
    .endOf("month")
    .toDate();

  const tutor = await db.tutor.findUnique({
    where: { id },
    include: {
      user: true,
      specialities: true,
      currency: true,
      students: {
        include: {
          user: { select: { name: true, phone: true } },
          plan: true,
          // student's next session – find via participants
          sessionParticipants: {
            where: {
              session: { startTime: { gt: new Date() }, cancelledBy: null },
            },
            orderBy: { session: { startTime: "asc" } },
            take: 1,
            include: { session: true },
          },
        },
      },
      sessions: {
        where: {
          startTime: { gte: startOfMonth, lte: endOfMonth },
          cancelledBy: null,
        },
        include: {
          participants: {
            include: {
              student: {
                select: { id: true, user: { select: { name: true } } },
              },
              report: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
      },
      notes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      tutorAvailabilities: true,
      expenses: {
        orderBy: { createdAt: "desc" },
        include: { currency: true },
      },
    },
  });

  if (!tutor) notFound();

  // ---- sessions as per‑participant rows ----
  const allParticipants: TutorSession[] = [];
  let totalPrivateMinutes = 0;
  let totalGroupMinutes = 0;
  let attendedSessions = 0;

  for (const session of tutor.sessions) {
    const participantCount = session.participants.length;
    if (participantCount <= 1) totalPrivateMinutes += session.durationMinutes;
    else totalGroupMinutes += session.durationMinutes;

    let anyAttended = false;
    for (const p of session.participants) {
      if (p.studentAttendanceStatus !== null) anyAttended = true;
      allParticipants.push({
        sessionId: session.id,
        participantId: p.id,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        durationMinutes: session.durationMinutes,
        status: getSessionStatus(session),
        topic: session.topic,
        studentId: p.studentId,
        studentName: p.student.user.name || "",
        attendance: {
          status: p.studentAttendanceStatus,
          reason: null, // if you have reason field, use p.reason
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
      });
    }
    if (anyAttended) attendedSessions++;
  }

  // ---- earnings ----
  const totalMonthlyEarnings =
    (totalPrivateMinutes / 60) * tutor.privatePricePerHour +
    (totalGroupMinutes / 60) * tutor.groupPricePerHour;
  const paidThisMonth = tutor.expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingThisMonth = totalMonthlyEarnings - paidThisMonth;

  // ---- attendance rate ----
  const totalParticipantsWithStatus = allParticipants.filter(
    (p) => p.attendance.status !== null,
  ).length;
  const attendedParticipants = allParticipants.filter(
    (p) =>
      p.attendance.status !== null &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        p.attendance.status,
      ),
  ).length;
  const attendanceRate =
    totalParticipantsWithStatus > 0
      ? (attendedParticipants / totalParticipantsWithStatus) * 100
      : 0;

  // ---- retention ----
  const lastMonthStudentIds = await db.sessionParticipant.findMany({
    where: {
      session: {
        tutorId: id,
        startTime: { gte: startOfLastMonth, lte: endOfLastMonth },
        cancelledBy: null,
      },
    },
    select: { studentId: true },
    distinct: ["studentId"],
  });
  const lastMonthStudentSet = new Set(
    lastMonthStudentIds.map((s) => s.studentId),
  );
  const currentMonthStudentIds = allParticipants.map((p) => p.studentId);
  const currentMonthStudentSet = new Set(currentMonthStudentIds);
  const retainedCount = [...lastMonthStudentSet].filter((sid) =>
    currentMonthStudentSet.has(sid),
  ).length;
  const retentionRate =
    lastMonthStudentSet.size > 0
      ? (retainedCount / lastMonthStudentSet.size) * 100
      : 100;

  // ---- report adherence & quality ----
  const participantsWithAttendance = allParticipants.filter(
    (p) =>
      p.attendance.status !== null &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        p.attendance.status,
      ),
  );
  const withReport = participantsWithAttendance.filter((p) => p.report).length;
  const reportAdherence =
    participantsWithAttendance.length > 0
      ? (withReport / participantsWithAttendance.length) * 100
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
    withReport > 0 ? (highQualityReports / withReport) * 100 : 0;

  // ---- weighted score ----
  const weightedScore =
    attendanceRate * 0.4 +
    retentionRate * 0.3 +
    reportAdherence * 0.2 +
    reportQuality * 0.1;

  let scoreHint = "";
  let scoreColor = "";
  if (weightedScore >= 70) {
    scoreHint = "أداء ممتاز – استمر على هذا النهج";
    scoreColor = "text-green-600";
  } else if (weightedScore >= 60) {
    scoreHint = "أداء جيد – نوصي بعقد جلسة تحسين مع المعلم";
    scoreColor = "text-yellow-600";
  } else if (weightedScore >= 50) {
    scoreHint = "يحتاج تحسين – ضع خطة تطوير واضحة";
    scoreColor = "text-orange-600";
  } else {
    scoreHint = "أداء ضعيف – فكر في نقل الطلاب أو الاستغناء عن المعلم";
    scoreColor = "text-red-600";
  }

  // ---- students ----
  const transformedStudents: AssignedStudent[] = tutor.students.map((s) => ({
    id: s.id,
    name: s.user.name || "",
    age: s.age,
    status: s.status,
    phone: s.user.phone || "",
    planTitle: s.plan?.title ?? null,
    nextSessionDate:
      s.sessionParticipants[0]?.session.startTime.toISOString() ?? null,
  }));

  // notes, payments, availabilities unchanged
  const transformedNotes: TutorNote[] = tutor.notes.map((n) => ({
    id: n.id,
    content: n.content,
    authorName: n.author.name ?? "مستخدم",
    createdAt: n.createdAt.toISOString(),
  }));

  const transformedPayments: TutorPayment[] = tutor.expenses.map((e) => ({
    id: e.id,
    amount: e.amount,
    currency: e.currency.code,
    status: e.status,
    method: e.method,
    date: e.updatedAt.toISOString(),
    description: e.description,
  }));

  const transformedAvailabilities: TutorAvailability[] =
    tutor.tutorAvailabilities.map((a) => ({
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
    }));

  const transformed: TutorProfile = {
    id: tutor.id,
    name: tutor.user.name ?? "",
    academyId: tutor.academyId,
    currencyId: tutor.currencyId,
    email: tutor.user.email,
    phone: tutor.user.phone,
    currency: tutor.currency.code,
    timezone: tutor.user.timezone,
    academyName:
      (
        await db.academy.findUnique({
          where: { id: tutor.academyId },
          select: { name: true },
        })
      )?.name ?? "",
    privatePricePerHour: tutor.privatePricePerHour,
    groupPricePerHour: tutor.groupPricePerHour,
    specialities: tutor.specialities.map((s) => s.title),
    active: tutor.active ?? false,
    bio: tutor.bio,
    qualifications: tutor.qualifications,
    imageUrl: tutor.imageUrl,
    zoomUrl: tutor.zoomUrl,
    zoomAuthenticated: tutor.zoomAuthenticated,
    availabilities: transformedAvailabilities,
    students: transformedStudents,
    sessions: allParticipants,
    notes: transformedNotes,
    payments: transformedPayments,
    monthlyStats: {
      totalSessions: tutor.sessions.length,
      attendedSessions,
      attendanceRate,
      totalEarnings: totalMonthlyEarnings,
      paid: paidThisMonth,
      pending: pendingThisMonth,
    },
    performanceMetrics: {
      attendanceRate,
      retentionRate,
      reportAdherence,
      reportQuality,
      weightedScore,
      scoreHint,
      scoreColor,
    },
  };

  const currencies = await db.currency.findMany({});
  const costCenters = await db.costCenter.findMany({});
  console.log({ costCenters });

  return (
    <TutorProfileClient
      costCenters={costCenters.map((c) => ({ id: c.id, name: c.title }))}
      currencies={currencies}
      tutor={transformed}
    />
  );
}
