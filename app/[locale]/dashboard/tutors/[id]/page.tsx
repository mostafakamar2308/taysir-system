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
          plan: true,
          sessions: {
            where: {
              startTime: { gt: new Date() },
              cancelledBy: {
                not: null,
              },
            },
            orderBy: { startTime: "asc" },
            take: 1,
          },
        },
      },
      sessions: {
        where: {
          startTime: { gte: startOfMonth, lte: endOfMonth },
        },
        include: {
          student: true,
          attendance: true,
          sessionReport: true,
        },
        orderBy: { startTime: "desc" },
      },
      notes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      tutorAvailabilities: true,
      expenses: {
        where: {
          tutorId: id,
          salaryMonth: dayjs().format("YYYY-MM"),
        },
        include: { currency: true },
      },
    },
  });

  if (!tutor) notFound();

  // Compute monthly payment stats
  const attendedSessions = tutor.sessions.filter(
    (s) =>
      s.attendance?.tutorAttendanceStatus === AttendanceStatus.ATTENDED ||
      s.attendance?.tutorAttendanceStatus
      === AttendanceStatus.LATE,
  ).length;
  const totalMonthlyEarnings = attendedSessions * tutor.pricePerSession;
  const paidThisMonth = tutor.expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingThisMonth = totalMonthlyEarnings - paidThisMonth;

  const lastMonthStudentIds = await db.session.findMany({
    where: {
      tutorId: id,
      startTime: { gte: startOfLastMonth, lte: endOfLastMonth },
    },
    distinct: ["studentId"],
    select: { studentId: true },
  });
  const lastMonthStudentSet = new Set(
    lastMonthStudentIds.map((s) => s.studentId),
  );
  const currentMonthStudentIds = tutor.sessions.map((s) => s.studentId);
  const currentMonthStudentSet = new Set(currentMonthStudentIds);
  const retainedCount = [...lastMonthStudentSet].filter((sid) =>
    currentMonthStudentSet.has(sid),
  ).length;
  const retentionRate =
    lastMonthStudentSet.size > 0
      ? (retainedCount / lastMonthStudentSet.size) * 100
      : 100;

  const totalCompletedSessions = tutor.sessions.filter(
    (s) => !s.cancelledBy && dayjs(s.startTime).isBefore(dayjs()),
  ).length;
  const attendedStudentSessions = tutor.sessions.filter(
    (s) =>
      !s.cancelledBy &&
      dayjs(s.startTime).isBefore(dayjs()) &&
      (s.attendance?.studentAttendanceStatus === 0 ||
        s.attendance?.studentAttendanceStatus === 3),
  ).length;
  const attendanceRate =
    totalCompletedSessions > 0
      ? (attendedStudentSessions / totalCompletedSessions) * 100
      : 0;

  // Report adherence and quality
  const sessionsWithReport = tutor.sessions.filter(
    (s) => s.sessionReport,
  ).length;
  const reportAdherence =
    tutor.sessions.length > 0
      ? (sessionsWithReport / tutor.sessions.length) * 100
      : 0;

  const highQualityReports = tutor.sessions.filter(
    (s) =>
      s.sessionReport &&
      s.sessionReport.outcomes &&
      s.sessionReport.strengths &&
      s.sessionReport.weaknesses &&
      s.sessionReport.nextGoals,
  ).length;
  const reportQuality =
    sessionsWithReport > 0
      ? (highQualityReports / sessionsWithReport) * 100
      : 0;

  // Weighted score
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

  // Transform other data
  const transformedStudents: AssignedStudent[] = tutor.students.map((s) => ({
    id: s.id,
    name: s.name,
    age: s.age,
    status: s.status,
    phone: s.phone,
    planTitle: s.plan?.title ?? null,
    nextSessionDate: s.sessions[0]?.startTime.toISOString() ?? null,
  }));

  const transformedSessions: TutorSession[] = tutor.sessions.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    durationMinutes: s.durationMinutes,
    status: getSessionStatus(s),
    topic: s.topic,
    studentId: s.studentId,
    studentName: s.student.name,
    attendance: s.attendance
      ? {
        id: s.attendance.id,
        tutorAttendance: s.attendance.tutorAttendanceStatus,
        studentAttendance: s.attendance.studentAttendanceStatus,
        reason: s.attendance.reason,
      }
      : undefined,
    report: s.sessionReport
      ? {
        id: s.sessionReport.id,
        outcomes: s.sessionReport.outcomes,
        strengths: s.sessionReport.strengths,
        weaknesses: s.sessionReport.weaknesses,
        nextGoals: s.sessionReport.nextGoals,
        comments: s.sessionReport.comments,
        rating: s.sessionReport.rating,
      }
      : undefined,
  }));

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
    pricePerSession: tutor.pricePerSession,
    specialities: tutor.specialities.map((s) => s.title),
    active: tutor.active ?? false,
    bio: tutor.bio,
    qualifications: tutor.qualifications,
    imageUrl: tutor.imageUrl,
    availabilities: transformedAvailabilities,
    students: transformedStudents,
    sessions: transformedSessions,
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

  return <TutorProfileClient currencies={currencies} tutor={transformed} />;
}
