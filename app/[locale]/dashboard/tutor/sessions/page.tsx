import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { DashboardSession, SessionStatus } from "@/types/session";
import dayjs from "@/lib/dayjs";
import SessionsClient from "@/components/tutor/sessions/viewer";
import { getSessionStatus } from "@/lib/session";

export default async function TutorSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    week?: string;
    filter?: string;
    sessionId?: string;
  }>;
}) {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Tutor || !currentUser.tutorId) {
    redirect("/login");
  }
  const tutorId = currentUser.tutorId;

  const { view = "calendar", week, filter, sessionId } = await searchParams;

  let startDate: Date;
  if (week) {
    startDate = dayjs(week).startOf("week").toDate();
  } else {
    startDate = dayjs().startOf("week").toDate();
  }
  const endDate = dayjs(startDate).endOf("week").toDate();

  const where: {
    tutorId: number;
    startTime?: { gte: Date; lt: Date };
    status?: SessionStatus;
    attendance?: null;
    sessionReport?: null;
  } = { tutorId };
  if (view === "calendar") {
    where.startTime = { gte: startDate, lt: endDate };
  }

  if (filter === "pending_attendance") {
    where.attendance = null;
  } else if (filter === "pending_reports") {
    where.sessionReport = null;
  }

  const sessions = await db.session.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, phone: true } },
      attendance: true,
      sessionReport: true,
    },
    orderBy: { startTime: "asc" },
  });

  const transformedSessions: DashboardSession[] = sessions.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    durationMinutes: s.durationMinutes,
    status: getSessionStatus(s),
    topic: s.topic,
    notes: s.notes,
    tutorId: s.tutorId,
    tutorName: currentUser.name,
    isTrial: s.isTrial,
    recurringPatternId: s.recurringPatternId,
    studentId: s.studentId,
    studentName: s.student.name,
    studentPhone: s.student.phone,
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
          rating: s.sessionReport.rating,
          outcomes: s.sessionReport.outcomes,
          strengths: s.sessionReport.strengths,
          weaknesses: s.sessionReport.weaknesses,
          nextGoals: s.sessionReport.nextGoals,
          comments: s.sessionReport.comments,
        }
      : undefined,
  }));

  return (
    <SessionsClient
      sessions={transformedSessions}
      view={view}
      currentWeekStart={startDate.toISOString()}
      filter={filter}
      sessionIdParam={sessionId ? parseInt(sessionId) : null}
    />
  );
}
