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
    studentId?: string;
    status?: string;
  }>;
}) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId || currentUser.role !== Role.Tutor || !currentUser.tutorId) {
    redirect("/login");
  }
  const tutorId = currentUser.tutorId;
  const academyId = currentUser.academyId;

  const { view = "calendar", week, filter, sessionId, studentId, status } = await searchParams;

  const where: {
    tutorId: number;
    startTime?: { gte: Date; lt: Date };
    status?: SessionStatus;
    attendance?: null;
    sessionReport?: null;
    studentId?: number;
  } = { tutorId };

  if (week) {
    const startDate = dayjs(week).startOf("week").toDate();
    const endDate = dayjs(startDate).endOf("week").toDate();
    where.startTime = { gte: startDate, lt: endDate };
  }

  if (studentId) {
    where.studentId = parseInt(studentId);
  }

  if (status) {
    where.status = parseInt(status) as SessionStatus;
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

  const students = await db.student.findMany({
    where: { tutorId },
  });

  const tutorStudents = students.map((s) => ({ id: s.id, name: s.name }));

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
      students={tutorStudents}
      view={view}
      currentWeekStart={week ? dayjs(week).startOf("week").toISOString() : dayjs().startOf("week").toISOString()}
      filter={filter}
      sessionIdParam={sessionId ? parseInt(sessionId) : null}
      tutorId={tutorId}
      academyId={academyId}
    />
  );
}