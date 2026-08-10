import db from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { user } from "@/lib/auth";
import GroupDetailClient from "@/components/dashboard/groups/groupDetail/viewer";
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import type {
  GroupDetail,
  StudentInGroup,
  GroupSession,
} from "@/types/groupDetails";
import { getRemainingSessionsForStudents } from "@/actions/studentFinances";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await user();
  if (!currentUser?.academyId) redirect("/login");
  const academyId = currentUser.academyId;

  const groupId = parseInt((await params).id);
  if (isNaN(groupId)) notFound();

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      currentTutor: {
        select: { id: true, user: { select: { name: true } } },
      },
      members: {
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      },
      sessions: {
        include: {
          participants: {
            include: {
              student: { select: { user: { select: { name: true } } } },
              report: true,
            },
          },
          tutorAttendance: true,
          group: {
            select: {
              currentTutor: { select: { user: { select: { name: true } } } },
            },
          },
        },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!group || group.academyId !== academyId) notFound();

  // Remaining sessions per student, scoped to this group's subscriptions
  const remainingMap = await getRemainingSessionsForStudents(
    group.members.map((m) => m.studentId),
    groupId,
  );

  // Students in group
  const students: StudentInGroup[] = group.members.map((m) => {
    return {
      studentId: m.studentId,
      studentName: m.student.user.name ?? "—",
      status: m.student.status,
      remainingSessions: remainingMap.get(m.studentId) ?? null,
      active: m.active,
    };
  });

  // Performance (average rating per student from reports)
  const studentRatings = new Map<number, number[]>();
  for (const session of group.sessions) {
    for (const p of session.participants) {
      if (p.report?.rating != null) {
        const arr = studentRatings.get(p.studentId) ?? [];
        arr.push(p.report.rating);
        studentRatings.set(p.studentId, arr);
      }
    }
  }
  const performances = Array.from(studentRatings.entries()).map(
    ([studentId, ratings]) => {
      const student = group.members.find((m) => m.studentId === studentId);
      return {
        studentId,
        studentName: student?.student.user.name ?? "—",
        averageRating:
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : null,
      };
    },
  );

  // Sessions
  const sessions: GroupSession[] = group.sessions.map((s) => {
    const attendanceCount = s.participants.filter(
      (p) => p.studentAttendanceStatus != null,
    ).length;
    const reportCount = s.participants.filter((p) => p.report).length;
    return {
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: dayjs(s.startTime)
        .add(s.durationMinutes, "minute")
        .toISOString(),
      status: getSessionStatus(s),
      topic: s.topic,
      tutorAttendanceStatus: s.tutorAttendance?.status ?? null,
      attendanceCount,
      totalParticipants: s.participants.length,
      reportCount,
      participants: s.participants.map((p) => ({
        studentId: p.studentId,
        studentName: p.student.user.name ?? "—",
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
    };
  });

  const detail: GroupDetail = {
    id: group.id,
    title: group.title,
    createdAt: group.createdAt.toISOString(),
    tutorId: group.currentTutorId,
    tutorName: group.currentTutor.user.name ?? "—",
    effectiveHourlyRate: group.tutorHourlyRate ?? 0, // we'll show tutor's base rate if null – but group.card already shows effective; here we can show group.tutorHourlyRate or fallback
    studentCount: group.members.length,
    activeStudentCount: group.members.filter((m) => m.active).length,
    students,
    performances,
    sessions,
  };

  const tutors = (
    await db.tutor.findMany({
      where: { academyId, active: true },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    })
  ).map((t) => ({ id: t.id, name: t.user.name }));

  return <GroupDetailClient group={detail} tutors={tutors} />;
}
