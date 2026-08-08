import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSessionStatus } from "@/lib/session";
import type { AdminSession, AdminSessionParticipant } from "@/types/session";
import SessionsViewer from "@/components/dashboard/sessions/viewer";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const currentUser = await user();
  if (!currentUser?.academyId) redirect("/login");
  const academyId = currentUser.academyId;

  const { week } = await searchParams;
  const refDate = week ? dayjs(week) : dayjs();
  // Compute Saturday‑Friday week. dayjs.startOf('week') gives Sunday, so we go back one day then add 6 days.
  const saturday = refDate.startOf("week").subtract(1, "day");
  const friday = saturday.add(6, "day").endOf("day");
  const weekStart = saturday.toDate();
  const weekEnd = friday.toDate();

  const sessions = await db.session.findMany({
    where: {
      academyId,
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
                fileUrl: `/api/file/solution/${solution.id}`, // download link
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
        : { id: 0, name: null, status: 0, notes: null, reviewedAt: null }, // fallback

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

  return (
    <SessionsViewer
      initialSessions={transformedSessions}
      initialWeekStart={saturday.format("YYYY-MM-DD")}
      academyId={academyId}
    />
  );
}
