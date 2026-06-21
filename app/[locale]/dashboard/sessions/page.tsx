import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import SessionViewer from "@/components/dashboard/sessions/viewer";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSessionStatus } from "@/lib/session";
import { AdminSessionClientData } from "@/types/session";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;

  const { week } = await searchParams;
  const refDate = week ? dayjs(week).toDate() : new Date();
  const weekStart = dayjs(refDate).startOf("week").toDate();
  const weekEnd = dayjs(refDate).endOf("week").toDate();
  weekEnd.setDate(weekEnd.getDate() + 1);

  // Fetch sessions with participants
  const sessions = await db.session.findMany({
    where: {
      academyId,
      startTime: { gte: weekStart, lt: weekEnd },
    },
    include: {
      tutor: { include: { user: { select: { name: true } } } },
      participants: {
        include: {
          student: {
            select: { id: true, user: { select: { name: true, phone: true } } },
          },
          report: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Transform to AdminSessionClientData
  const transformedSessions: AdminSessionClientData[] = sessions.map((s) => {
    const participantList = s.participants.map((p) => ({
      participantId: p.id,
      studentId: p.studentId,
      studentName: p.student.user.name || "",
      studentPhone: p.student.user.phone,
      attendanceStatus: p.studentAttendanceStatus,
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

    const first = participantList[0];
    return {
      id: s.id,
      startTime: dayjs.utc(s.startTime).toISOString(),
      endTime: dayjs.utc(s.endTime).toISOString(),
      durationMinutes: s.durationMinutes,
      status: getSessionStatus(s),
      topic: s.topic,
      notes: s.notes,
      tutorId: s.tutorId,
      tutorName: s.tutor.user.name ?? null,
      isTrial: s.isTrial,
      studentId: first?.studentId ?? null,
      studentName: participantList.map((p) => p.studentName).join("، ") || "",
      studentPhone: first?.studentPhone ?? null,
      zoomMeetingId: s.zoomMeetingId,
      zoomJoinUrl: s.zoomJoinUrl,
      zoomStartUrl: s.zoomStartUrl,
      attendance: first
        ? {
            id: first.participantId,
            tutorAttendance: null, // no global tutor attendance
            studentAttendance: first.attendanceStatus,
            reason: null,
          }
        : undefined,
      report: first?.report ?? undefined,
      participants: participantList,
    };
  });

  // Fetch students and tutors for filters
  const students = await db.student.findMany({
    where: { academyId },
    select: {
      id: true,
      sessionsBalance: true,
      user: { select: { name: true } },
      tutorId: true,
    },
  });
  const tutors = await db.tutor.findMany({
    where: { academyId },
    include: { user: { select: { name: true } } },
  });

  return (
    <SessionViewer
      initialSessions={transformedSessions}
      initialWeekStart={dayjs(weekStart).format("YYYY-MM-DD")}
      students={students.map((s) => ({
        ...s,
        name: s.user.name || "",
        balance: s.sessionsBalance,
      }))}
      tutors={tutors.map((t) => ({ id: t.id, name: t.user.name }))}
    />
  );
}
