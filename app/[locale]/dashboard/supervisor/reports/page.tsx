import db from "@/lib/prisma";
import { redirect } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import { getCurrentSupervisor, supervisorSessionScope } from "@/lib/supervisor";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import SupervisorReportsViewer from "@/components/dashboard/supervisor/reports/viewer";

export interface MissingReportItem {
  sessionId: number;
  startTime: string;
  topic: string | null;
  tutorName: string;
  missingStudents: string[];
}

export interface PendingTutorReviewItem {
  sessionId: number;
  startTime: string;
  topic: string | null;
  tutorName: string;
  groupName: string;
}

export default async function SupervisorReportsPage() {
  const supervisor = await getCurrentSupervisor();
  if (!supervisor) redirect("/login");

  const scope = supervisorSessionScope(supervisor.id);
  const now = dayjs.utc();
  const fromDate = now.subtract(14, "day").toDate();

  const sessions = await db.session.findMany({
    where: {
      academyId: supervisor.academyId,
      OR: [...scope],
      cancelledBy: null,
      startTime: { gte: fromDate },
    },
    include: {
      group: { select: { title: true } },
      tutor: { select: { user: { select: { name: true } } } },
      participants: {
        include: {
          student: { select: { user: { select: { name: true } } } },
          report: true,
        },
      },
      tutorAttendance: { select: { id: true } },
    },
    orderBy: { startTime: "desc" },
  });

  const missingReportItems: MissingReportItem[] = [];
  const pendingTutorReviewItems: PendingTutorReviewItem[] = [];

  for (const s of sessions) {
    if (getSessionStatus(s) !== SessionStatus.COMPLETED) continue;

    const missingStudents = s.participants
      .filter(
        (p) =>
          p.studentAttendanceStatus !== null &&
          [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
            p.studentAttendanceStatus,
          ) &&
          !p.report,
      )
      .map((p) => p.student.user.name ?? "طالب");

    if (missingStudents.length > 0) {
      missingReportItems.push({
        sessionId: s.id,
        startTime: s.startTime.toISOString(),
        topic: s.topic,
        tutorName: s.tutor.user.name ?? "",
        missingStudents,
      });
    }

    if (!s.tutorAttendance) {
      pendingTutorReviewItems.push({
        sessionId: s.id,
        startTime: s.startTime.toISOString(),
        topic: s.topic,
        tutorName: s.tutor.user.name ?? "",
        groupName: s.group.title,
      });
    }
  }

  return (
    <SupervisorReportsViewer
      missingReportItems={missingReportItems}
      pendingTutorReviewItems={pendingTutorReviewItems}
    />
  );
}
