import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { redirect } from "next/navigation";
import { getSessionStatus } from "@/lib/session";
import { getCurrentSupervisor, supervisorSessionScope } from "@/lib/supervisor";
import type { AdminSession, AdminSessionParticipant } from "@/types/session";
import SupervisorSessionsViewer from "@/components/dashboard/supervisor/sessions/viewer";

export default async function SupervisorSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; sessionId?: string }>;
}) {
  const supervisor = await getCurrentSupervisor();
  if (!supervisor) redirect("/login");

  const scope = supervisorSessionScope(supervisor.id);
  const { week, sessionId } = await searchParams;

  // When a specific session is requested (e.g. from the reports page), jump to
  // its week so it appears in the list and the detail panel can open.
  let effectiveWeek = week;
  if (sessionId && !isNaN(parseInt(sessionId))) {
    const target = await db.session.findUnique({
      where: { id: parseInt(sessionId) },
      select: { startTime: true },
    });
    if (target) {
      effectiveWeek = dayjs(target.startTime)
        .startOf("week")
        .subtract(1, "day")
        .format("YYYY-MM-DD");
    }
  }

  const refDate = effectiveWeek ? dayjs(effectiveWeek) : dayjs();
  const saturday = refDate.startOf("week").subtract(1, "day");
  const friday = saturday.add(6, "day").endOf("day");
  const weekStart = saturday.toDate();
  const weekEnd = friday.toDate();

  const sessions = await db.session.findMany({
    where: {
      academyId: supervisor.academyId,
      OR: [...scope],
      startTime: { gte: weekStart, lt: weekEnd },
    },
    include: {
      group: { select: { id: true, title: true } },
      tutor: { select: { id: true, user: { select: { name: true } } } },
      supervisor: {
        select: { id: true, user: { select: { name: true } } },
      },
      participants: {
        include: {
          student: { select: { id: true, user: { select: { name: true } } } },
          report: true,
        },
      },
      tutorAttendance: {
        include: {
          supervisor: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const transformedSessions: AdminSession[] = sessions.map((s) => {
    const participantList: AdminSessionParticipant[] = s.participants.map(
      (p) => ({
        id: p.id,
        studentId: p.studentId,
        name: p.student.user.name ?? "",
        status: p.studentAttendanceStatus,
        reason: p.reason,
        price: p.price,
        paymentStatus: p.paymentStatus,
        report: p.report
          ? {
              id: p.report.id,
              rating: p.report.rating,
              outcome: p.report.outcomes,
              strengths: p.report.strengths,
              weaknesses: p.report.weaknesses,
              nextGoals: p.report.nextGoals,
              comments: p.report.comments,
            }
          : null,
        homeworkSolution: null,
      }),
    );

    return {
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: dayjs(s.startTime)
        .add(s.durationMinutes, "minute")
        .toISOString(),
      durationMinutes: s.durationMinutes,
      topic: s.topic,
      isTrial: s.isTrial,
      cancelledBy: s.cancelledBy,
      status: getSessionStatus({ cancelledBy: s.cancelledBy, startTime: s.startTime }),
      zoomUrl: s.zoomUrl,
      groupId: s.groupId,
      groupName: s.group.title,
      tutorId: s.tutorId,
      tutorName: s.tutor.user.name ?? "",
      tutorRate: s.tutorRate,
      tutorAttendance: s.tutorAttendance
        ? {
            id: s.tutorAttendance.id,
            name: s.tutorAttendance.supervisor?.user.name ?? null,
            status: s.tutorAttendance.status,
            notes: s.tutorAttendance.notes,
            reviewedAt: s.tutorAttendance.reviewedAt?.toISOString() ?? null,
          }
        : null,
      supervisorId: s.supervisorId,
      supervisorName: s.supervisor.user.name ?? "",
      participants: participantList,
      assignment: null,
      createdAt: s.createdAt.toISOString(),
    };
  });

  return (
    <SupervisorSessionsViewer
      initialSessions={transformedSessions}
      initialWeekStart={saturday.format("YYYY-MM-DD")}
      initialSessionId={sessionId ? parseInt(sessionId) : null}
    />
  );
}
