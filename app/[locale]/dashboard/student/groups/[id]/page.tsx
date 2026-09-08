import { notFound, redirect } from "next/navigation";
import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import type {
  StudentGroupDetail,
  StudentGroupSession,
} from "@/types/student/groups";
import StudentGroupDetailClient from "@/components/dashboard/student/groups/groupDetail";

export default async function StudentGroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const groupId = parseInt(id);
  if (isNaN(groupId)) notFound();

  const currentUser = await user();
  if (!currentUser || !currentUser.studentId) redirect("/login");

  const studentId = currentUser.studentId;

  const membership = await db.groupStudent.findFirst({
    where: { studentId, groupId },
    include: {
      group: {
        include: {
          currentTutor: { include: { user: { select: { name: true } } } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  if (!membership) notFound();

  const group = membership.group;

  const participants = await db.sessionParticipant.findMany({
    where: { studentId, session: { groupId } },
    include: {
      session: {
        include: {
          tutor: { include: { user: { select: { name: true } } } },
        },
      },
      report: true,
    },
    orderBy: { session: { startTime: "desc" } },
  });

  const ratings = participants
    .map((p) => p.report?.rating)
    .filter((r): r is number => r != null);
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

  const ratedSessions = participants
    .filter((p) => p.report?.rating != null)
    .map((p) => ({
      sessionDate: p.session.startTime.toISOString(),
      rating: p.report!.rating!,
    }))
    .sort(
      (a, b) =>
        new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime(),
    );

  const sessions: StudentGroupSession[] = participants.map((p) => ({
    id: p.session.id,
    startTime: p.session.startTime.toISOString(),
    endTime: dayjs.utc(p.session.startTime)
      .add(p.session.durationMinutes, "minute")
      .toISOString(),
    status: getSessionStatus(p.session),
    topic: p.session.topic,
    tutorName: p.session.tutor.user.name ?? "",
    attendanceStatus: p.studentAttendanceStatus,
    report: p.report
      ? {
          rating: p.report.rating,
          outcomes: p.report.outcomes,
          strengths: p.report.strengths,
          weaknesses: p.report.weaknesses,
          nextGoals: p.report.nextGoals,
          comments: p.report.comments,
        }
      : null,
  }));

  const detail: StudentGroupDetail = {
    id: group.id,
    title: group.title,
    createdAt: group.createdAt.toISOString(),
    tutorName: group.currentTutor.user.name ?? "—",
    isPrivate: group._count.members === 1,
    active: group.active,
    studentCount: group._count.members,
    averageRating,
    reportCount: ratings.length,
    latestRating:
      ratedSessions.length > 0
        ? ratedSessions[ratedSessions.length - 1].rating
        : null,
    ratings: ratedSessions,
    sessions,
  };

  return (
    <StudentGroupDetailClient
      group={detail}
      backHref={`/${locale}/dashboard/student/groups`}
    />
  );
}