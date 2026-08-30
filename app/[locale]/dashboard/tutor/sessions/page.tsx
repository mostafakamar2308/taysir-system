import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSessionStatus } from "@/lib/session";
import type { AdminSession, AdminSessionParticipant } from "@/types/session";
import { SessionClientData } from "@/types/tutor/session";
import TutorSessionsViewer from "@/components/tutor/sessions/viewer";
import { getAcademySchedulingSettings } from "@/lib/academySettings";

export default async function TutorSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const currentUser = await user();
  if (!currentUser?.tutorId || !currentUser?.academyId) redirect("/login");
  const tutorId = currentUser.tutorId;
  const academyId = currentUser.academyId;

  const schedulingSettings = await getAcademySchedulingSettings(academyId);

  const { week } = await searchParams;
  const refDate = week ? dayjs(week) : dayjs();
  const saturday = refDate.startOf("week").subtract(1, "day");
  const friday = saturday.add(6, "day").endOf("day");
  const weekStart = saturday.toDate();
  const weekEnd = friday.toDate();

  const sessions = await db.session.findMany({
    where: {
      academyId,
      startTime: { gte: weekStart, lt: weekEnd },
      group: { currentTutorId: tutorId },
    },
    include: {
      group: { select: { id: true, title: true } },
      tutor: { select: { id: true, user: { select: { name: true } } } },
      supervisor: {
        select: { id: true, user: { select: { name: true } } },
      },
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
          solutions: {
            include: {
              participant: { select: { id: true } },
            },
          },
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
    const endTime = dayjs(s.startTime)
      .add(s.durationMinutes, "minute")
      .toISOString();
    const participantList: AdminSessionParticipant[] = s.participants.map(
      (p) => {
        const solution = s.assignment?.solutions.find(
          (sol) => sol.participantId === p.id,
        );
        return {
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
          homeworkSolution: solution
            ? {
                id: solution.id,
                assignmentId: solution.assignmentId,
                participantId: solution.participantId,
                fileUrl: `/api/file/solution/${solution.id}`,
                score: solution.score,
                feedback: solution.feedback,
                submittedAt: solution.submittedAt.toISOString(),
                gradedAt: solution.gradedAt?.toISOString() ?? null,
                gradedBy: solution.gradedBy,
              }
            : null,
        };
      },
    );

    return {
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime,
      durationMinutes: s.durationMinutes,
      topic: s.topic,
      isTrial: s.isTrial,
      cancelledBy: s.cancelledBy,
      status: getSessionStatus({
        cancelledBy: s.cancelledBy,
        startTime: s.startTime,
      }),
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
        : { id: 0, name: null, status: 0, notes: null, reviewedAt: null },
      supervisorId: s.supervisorId,
      supervisorName: s.supervisor.user.name ?? "",
      participants: participantList,
      assignment: s.assignment
        ? {
            id: s.assignment.id,
            title: s.assignment.title,
            description: s.assignment.description,
            deadline: s.assignment.deadline?.toISOString() ?? "",
            maxScore: s.assignment.maxScore,
            fileUrl: `/api/file/assignment/${s.assignment.id}`,
          }
        : null,
      createdAt: s.createdAt.toISOString(),
    };
  });

  const clientData: SessionClientData[] = sessions.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: dayjs(s.startTime)
      .add(s.durationMinutes, "minute")
      .toISOString(),
    durationMinutes: s.durationMinutes,
    status: getSessionStatus({
      cancelledBy: s.cancelledBy,
      startTime: s.startTime,
    }),
    topic: s.topic,
    notes: s.notes,
    tutorId: s.tutorId,
    tutorName: s.tutor.user.name ?? "",
    isTrial: s.isTrial,
    studentName:
      s.participants.map((p) => p.student.user.name ?? "").join("، ") || "",
    zoomMeetingId: null,
    zoomJoinUrl: s.zoomUrl,
    zoomStartUrl: s.zoomUrl,
    participants: s.participants.map((p) => ({
      participantId: p.id,
      studentId: p.studentId,
      studentName: p.student.user.name ?? "",
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
      uploadedCount: s.assignment?.solutions.length ?? 0,
      gradedCount:
        s.assignment?.solutions.filter((sol) => sol.score !== null).length ?? 0,
    },
  }));

  return (
    <TutorSessionsViewer
      initialSessions={transformedSessions}
      initialSessionData={clientData}
      initialWeekStart={saturday.format("YYYY-MM-DD")}
      tutorId={tutorId}
      academyId={academyId}
      canCreateSessions={schedulingSettings.tutorsCanCreateSessions}
      canEditSessionTime={schedulingSettings.tutorsCanEditSessionTime}
    />
  );
}
