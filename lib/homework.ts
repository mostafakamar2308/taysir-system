import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";

type Participant = Prisma.SessionParticipantGetPayload<{
  include: {
    session: {
      include: {
        tutor: { include: { user: { select: { name: true } } } };
        assignment: { include: { solutions: true } };
      };
    };
    report: true;
  };
}>;

export function computeHomeworkData(participants: Participant[]) {
  const pendingAssignments: {
    sessionId: number;
    assignment: NonNullable<Participant["session"]["assignment"]>;
  }[] = [];
  let lastAssignmentData: {
    participantId: number;
    sessionDate: string;
    topic: string | null;
    assignment: {
      id: number;
      title: string | null;
      description: string | null;
      deadline: string | null;
      maxScore: number;
      filePath: string;
      originalFileName: string;
    };
    solution: {
      id: number;
      filePath: string;
      originalFileName: string;
      score: number | null;
      feedback: string | null;
      submittedAt: string;
      gradedAt: string | null;
    } | null;
  } | null = null;

  const sessionsWithAssignment = participants.map((p) => {
    const assignment = p.session.assignment;
    const solution =
      assignment?.solutions.find((s) => s.participantId === p.id) ?? null;

    if (assignment && !solution) {
      pendingAssignments.push({ sessionId: p.session.id, assignment });
    }

    if (assignment) {
      const sessionDate = p.session.startTime.toISOString();
      if (
        !lastAssignmentData ||
        dayjs.utc(sessionDate).isAfter(lastAssignmentData.sessionDate)
      ) {
        lastAssignmentData = {
          participantId: p.id,
          sessionDate,
          topic: p.session.topic,
          assignment: {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            deadline: assignment.deadline?.toISOString() ?? null,
            maxScore: assignment.maxScore,
            filePath: assignment.filePath,
            originalFileName: assignment.originalFileName,
          },
          solution: solution
            ? {
                id: solution.id,
                filePath: solution.filePath,
                originalFileName: solution.originalFileName,
                score: solution.score,
                feedback: solution.feedback,
                submittedAt: solution.submittedAt.toISOString(),
                gradedAt: solution.gradedAt?.toISOString() ?? null,
              }
            : null,
        };
      }
    }

    return {
      id: p.session.id,
      participantId: p.id,
      startTime: p.session.startTime.toISOString(),
      endTime: p.session.endTime.toISOString(),
      topic: p.session.topic,
      tutorName: p.session.tutor.user.name ?? "معلم",
      status: getSessionStatus(p.session),
      attendance: p.studentAttendanceStatus,
      hasReport: !!p.report,
      assignment: assignment
        ? {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            deadline: assignment.deadline?.toISOString() ?? null,
            maxScore: assignment.maxScore,
            filePath: assignment.filePath,
            originalFileName: assignment.originalFileName,
          }
        : null,
      solution: solution
        ? {
            id: solution.id,
            filePath: solution.filePath,
            originalFileName: solution.originalFileName,
            score: solution.score,
            feedback: solution.feedback,
            submittedAt: solution.submittedAt.toISOString(),
            gradedAt: solution.gradedAt?.toISOString() ?? null,
          }
        : null,
    };
  });

  return { pendingAssignments, lastAssignmentData, sessionsWithAssignment };
}
