import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import dayjs from "@/lib/dayjs";
import SessionsClient from "@/components/tutor/sessions/viewer";
import { getSessionStatus } from "@/lib/session";
import { AttendanceStatus } from "@/types/session";
import { SessionClientData } from "@/types/tutor/session";
import { Prisma } from "@/generated/prisma/client";

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
  if (
    !currentUser ||
    !currentUser.academyId ||
    currentUser.role !== Role.Tutor ||
    !currentUser.tutorId
  ) {
    redirect("/login");
  }
  const tutorId = currentUser.tutorId;

  const { week, filter, sessionId, studentId, status } = await searchParams;

  // Build Prisma where – fully typed
  const where: Prisma.SessionWhereInput = { tutorId };
  if (week) {
    const startDate = dayjs(week).startOf("week").toDate();
    const endDate = dayjs(startDate).endOf("week").toDate();
    where.startTime = { gte: startDate, lt: endDate };
  }
  if (studentId) {
    where.participants = { some: { studentId: parseInt(studentId) } };
  }
  if (filter === "pending_attendance") {
    where.participants = { some: { studentAttendanceStatus: null } };
  }

  const sessions = await db.session.findMany({
    where,
    include: {
      participants: {
        include: {
          student: {
            select: { id: true, user: { select: { name: true, phone: true } } },
          },
          report: true,
        },
      },
      assignment: {
        include: {
          solutions: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  // Students for filter dropdown
  const students = await db.student.findMany({
    where: { tutorId },
    select: {
      id: true,
      sessionsBalance: true,
      user: { select: { name: true } },
    },
  });
  const tutorStudents = students.map((s) => ({
    id: s.id,
    name: s.user.name || "",
    balance: s.sessionsBalance,
  }));

  // Transform to clean SessionClientData
  let transformedSessions: SessionClientData[] = sessions.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    durationMinutes: s.durationMinutes,
    status: getSessionStatus(s),
    topic: s.topic,
    notes: s.notes,
    tutorId: s.tutorId,
    tutorName: currentUser.name!,
    isTrial: s.isTrial,
    studentName:
      s.participants.map((p) => p.student.user.name || "").join("، ") || "",
    zoomMeetingId: s.zoomMeetingId,
    zoomJoinUrl: s.zoomJoinUrl,
    zoomStartUrl: s.zoomStartUrl,
    participants: s.participants.map((p) => ({
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
    })),
    assignmentStats: {
      totalParticipants: s.participants.length,
      hasAssignment: !!s.assignment,
      uploadedCount: s.assignment?.solutions?.length ?? 0,
      gradedCount:
        s.assignment?.solutions?.filter((sol) => sol.score !== null).length ??
        0,
    },
  }));

  // Apply pending_reports filter (post‑processing)
  if (filter === "pending_reports") {
    transformedSessions = transformedSessions.filter((s) =>
      s.participants.some(
        (p) =>
          p.attendanceStatus !== null &&
          [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
            p.attendanceStatus,
          ) &&
          !p.report,
      ),
    );
  }

  // Client‑side status filter
  if (status) {
    const statusNum = parseInt(status);
    transformedSessions = transformedSessions.filter(
      (s) => s.status === statusNum,
    );
  }

  return (
    <SessionsClient
      sessions={transformedSessions}
      students={tutorStudents}
      currentWeekStart={
        week
          ? dayjs(week).startOf("week").toISOString()
          : dayjs().startOf("week").toISOString()
      }
      filter={filter}
      sessionIdParam={sessionId ? parseInt(sessionId) : null}
      tutorId={tutorId}
    />
  );
}
