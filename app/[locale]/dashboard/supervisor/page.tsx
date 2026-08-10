import db from "@/lib/prisma";
import { redirect } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import { getCurrentSupervisor, supervisorSessionScope } from "@/lib/supervisor";
import { AttendanceStatus } from "@/types/session";
import SupervisorOverviewViewer from "@/components/dashboard/supervisor/overview/viewer";

export interface SupervisorSessionItem {
  id: number;
  startTime: string;
  endTime: string;
  topic: string | null;
  status: number;
  tutorName: string;
  studentNames: string[];
  hasAnyAttendanceMissing: boolean;
  hasAnyReportMissing: boolean;
  hasTutorReviewMissing: boolean;
  meetingLink: string | null;
}

export default async function SupervisorDashboardPage() {
  const supervisor = await getCurrentSupervisor();
  if (!supervisor) redirect("/login");

  const scope = supervisorSessionScope(supervisor.id);

  const now = dayjs.utc();
  const todayStart = now.startOf("day").toDate();
  const todayEnd = now.endOf("day").toDate();
  const endOfWeek = now.endOf("week").subtract(1, "day").endOf("day").toDate();

  const sessions = await db.session.findMany({
    where: {
      academyId: supervisor.academyId,
      OR: [...scope],
      cancelledBy: null,
      startTime: { lte: endOfWeek },
    },
    include: {
      tutor: { select: { user: { select: { name: true } } } },
      participants: {
        include: {
          student: { select: { user: { select: { name: true } } } },
          report: true,
        },
      },
      tutorAttendance: { select: { id: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const toItem = (s: (typeof sessions)[number]): SupervisorSessionItem => {
    const status = getSessionStatus(s);
    return {
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: dayjs
        .utc(s.startTime)
        .add(s.durationMinutes, "minute")
        .toISOString(),
      topic: s.topic,
      status,
      tutorName: s.tutor.user.name ?? "",
      studentNames: s.participants.map((p) => p.student.user.name ?? ""),
      hasAnyAttendanceMissing: s.participants.some(
        (p) => p.studentAttendanceStatus === null,
      ),
      hasAnyReportMissing: s.participants.some(
        (p) =>
          p.studentAttendanceStatus !== null &&
          [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
            p.studentAttendanceStatus,
          ) &&
          !p.report,
      ),
      hasTutorReviewMissing: !s.tutorAttendance,
      meetingLink: s.zoomUrl,
    };
  };

  const allItems = sessions.map(toItem);

  const todaySessions = allItems.filter(
    (s) =>
      new Date(s.startTime) >= todayStart && new Date(s.startTime) <= todayEnd,
  );
  const upcomingSessions = allItems.filter(
    (s) => new Date(s.startTime) > todayEnd,
  );

  const startedSessions = allItems.filter(
    (s) => new Date(s.startTime) <= now.toDate(),
  );
  const pendingAttendance = startedSessions.filter(
    (s) => s.hasAnyAttendanceMissing,
  );
  const pendingReports = startedSessions.filter((s) => s.hasAnyReportMissing);
  const pendingTutorReviews = startedSessions.filter(
    (s) => s.hasTutorReviewMissing,
  );

  const tutorsMonitored = await db.tutor.count({
    where: { academyId: supervisor.academyId, defaultSupervisorId: supervisor.id },
  });

  return (
    <SupervisorOverviewViewer
      todaySessions={todaySessions}
      upcomingSessions={upcomingSessions}
      pendingAttendance={pendingAttendance.length}
      pendingReports={pendingReports.length}
      pendingTutorReviews={pendingTutorReviews.length}
      tutorsMonitored={tutorsMonitored}
    />
  );
}
