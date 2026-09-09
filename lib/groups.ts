import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import { getRemainingSessionsForStudents } from "@/actions/studentFinances";
import type { Prisma } from "@/generated/prisma/client";
import type { DashboardGroup } from "@/types/group";
import type {
  GroupDetail,
  GroupSession,
  StudentInGroup,
} from "@/types/groupDetails";

// Public groups = real groups (>= 2 members). Private groups = 1-on-1 sessions
// (fewer than 2 members) that are stored as groups.
const isPublicMembers = (members: DashboardGroup["members"]) =>
  members.length >= 2;

// Fetches group list overview data (next/latest session, active student count)
// for the given scope. Only student names are selected — contact info
// (phone/email) is never loaded for non-admin roles.
export async function getGroupOverview(where: Prisma.GroupWhereInput) {
  const groups = await db.group.findMany({
    where,
    include: {
      currentTutor: {
        select: {
          id: true,
          user: { select: { name: true } },
          baseHourlyRate: true,
          baseGroupHourlyRate: true,
        },
      },
      members: {
        include: {
          student: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { title: "asc" },
  });

  const groupIds = groups.map((g) => g.id);
  const sessions = await db.session.findMany({
    where: { groupId: { in: groupIds } },
    select: { startTime: true, groupId: true },
  });

  const sessionDatesByGroup = new Map<number, dayjs.Dayjs[]>();
  for (const session of sessions) {
    const dates = sessionDatesByGroup.get(session.groupId) ?? [];
    dates.push(dayjs.utc(session.startTime));
    sessionDatesByGroup.set(session.groupId, dates);
  }

  const now = dayjs.utc();

  const transformed: DashboardGroup[] = groups.map((g) => {
    const dates = sessionDatesByGroup.get(g.id) ?? [];
    dates.sort((a, b) => a.valueOf() - b.valueOf());

    const futureDates = dates.filter((d) => d.valueOf() > now.valueOf());
    const nextSessionDate =
      futureDates.length > 0 ? futureDates[0].toISOString() : null;

    const pastDates = dates.filter((d) => d.valueOf() <= now.valueOf());
    const latestSessionDate =
      pastDates.length > 0
        ? pastDates[pastDates.length - 1].toISOString()
        : null;

    const activeMembers = g.members.filter((m) => m.active);
    return {
      id: g.id,
      title: g.title,
      academyId: g.academyId,
      currentTutorId: g.currentTutorId,
      currentTutorName: g.currentTutor.user.name ?? "—",
      baseHourlyRate: g.currentTutor.baseHourlyRate,
      baseGroupHourlyRate: g.currentTutor.baseGroupHourlyRate,
      tutorHourlyRate: g.tutorHourlyRate,
      active: g.active,
      activeStudentsCount: activeMembers.length,
      nextSessionDate,
      latestSessionDate,
      members: g.members.map((m) => ({
        studentId: m.studentId,
        studentName: m.student.user.name ?? "—",
        active: m.active,
      })),
    };
  });

  return {
    groups: transformed,
    publicGroups: transformed.filter((g) => isPublicMembers(g.members)),
    privateGroups: transformed.filter((g) => !isPublicMembers(g.members)),
  };
}

// Fetches a single group's full detail (students, sessions, attendance,
// reports, per-student rating averages) scoped with `where`. Only student
// names are selected — no contact info. When `opts.readOnly` is true,
// subscription-derived data (remaining sessions, membership active flag,
// student status) is not computed nor included.
export async function getGroupDetail(
  where: Prisma.GroupWhereInput,
  opts?: { readOnly?: boolean },
) {
  const { readOnly = false } = opts ?? {};
  const group = await db.group.findFirst({
    where,
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

  if (!group) return null;

  let remainingMap = new Map<number, number | null>();
  if (!readOnly) {
    const remainingRes = await getRemainingSessionsForStudents(
      group.members.map((m) => m.studentId),
      group.id,
    );
    if (remainingRes.ok && remainingRes.data) remainingMap = remainingRes.data;
  }

  const students: StudentInGroup[] = group.members.map((m) => {
    if (readOnly) {
      return {
        studentId: m.studentId,
        studentName: m.student.user.name ?? "—",
      };
    }
    return {
      studentId: m.studentId,
      studentName: m.student.user.name ?? "—",
      status: m.student.status,
      remainingSessions: remainingMap.get(m.studentId) ?? null,
      active: m.active,
    };
  });

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
      recordingLink: s.recordingLink ?? null,
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
    effectiveHourlyRate: group.tutorHourlyRate ?? 0,
    studentCount: group.members.length,
    activeStudentCount: group.members.filter((m) => m.active).length,
    students,
    performances,
    sessions,
  };

  return { group: detail, academyId: group.academyId };
}