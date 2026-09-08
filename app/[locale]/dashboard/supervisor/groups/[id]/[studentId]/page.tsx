import { notFound, redirect } from "next/navigation";
import db from "@/lib/prisma";
import { getCurrentSupervisor } from "@/lib/supervisor";
import { getSessionStatus } from "@/lib/session";
import dayjs from "@/lib/dayjs";
import type {
  ReadOnlyStudentProfile,
  SessionRecord,
} from "@/types/studentProfile";
import ReadOnlyStudentProfileClient from "@/components/dashboard/groups/studentProfile/readOnlyStudentProfile";

export default async function SupervisorGroupStudentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; studentId: string }>;
}) {
  const { locale, id: groupId, studentId } = await params;
  const gid = parseInt(groupId);
  const sid = parseInt(studentId);
  if (isNaN(gid) || isNaN(sid)) notFound();

  const supervisor = await getCurrentSupervisor();
  if (!supervisor) redirect("/login");

  const membership = await db.groupStudent.findFirst({
    where: {
      groupId: gid,
      studentId: sid,
      group: { academyId: supervisor.academyId },
    },
  });
  if (!membership) notFound();

  const student = await db.student.findUnique({
    where: { id: sid, academyId: supervisor.academyId },
    include: {
      user: { select: { name: true, timezone: true, preferredLanguage: true } },
      groupMemberships: {
        include: {
          group: {
            include: {
              currentTutor: {
                include: { user: { select: { name: true, timezone: true, preferredLanguage: true } } },
              },
              _count: {
                select: { members: { where: { active: true } } },
              },
            },
          },
        },
      },
      sessionParticipants: {
        include: {
          session: {
            include: {
              group: {
                select: {
                  id: true,
                  title: true,
                  currentTutor: {
                    include: { user: { select: { name: true, timezone: true, preferredLanguage: true } } },
                  },
                },
              },
            },
          },
          report: true,
          homeworkSolutions: {
            take: 1,
            orderBy: { submittedAt: "desc" },
          },
        },
        orderBy: { session: { startTime: "desc" } },
      },
    },
  });

  if (!student) notFound();

  const sessions: SessionRecord[] = student.sessionParticipants.map((p) => {
    const solution = p.homeworkSolutions[0] ?? null;
    return {
      id: p.session.id,
      startTime: p.session.startTime.toISOString(),
      endTime: dayjs(p.session.startTime)
        .add(p.session.durationMinutes, "minute")
        .toISOString(),
      durationMinutes: p.session.durationMinutes,
      status: getSessionStatus(p.session),
      topic: p.session.topic,
      notes: p.session.notes,
      tutorId: p.session.group.currentTutor.id,
      tutorName: p.session.group.currentTutor.user.name ?? "",
      groupId: p.session.group.id,
      groupName: p.session.group.title,
      attendance: {
        id: p.id,
        status: p.studentAttendanceStatus,
        reason: p.reason ?? null,
      },
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
      homeworkSolution: solution
        ? {
            id: solution.id,
            score: solution.score,
            submittedAt: solution.submittedAt.toISOString(),
            gradedAt: solution.gradedAt?.toISOString() ?? null,
          }
        : null,
    };
  });

  const lite: ReadOnlyStudentProfile = {
    id: student.id,
    name: student.user.name || "",
    age: student.age,
    country: student.country,
    timezone: student.user.timezone || "",
    source: student.source,
    preferredLanguage: student.user.preferredLanguage,
    groups: student.groupMemberships.map((m) => ({
      groupId: m.group.id,
      tutorName: m.group.currentTutor.user.name ?? "غير معروف",
      isPrivate: m.group._count.members === 1,
    })),
    sessions,
  };

  return (
    <ReadOnlyStudentProfileClient
      student={lite}
      backHref={`/${locale}/dashboard/supervisor/groups/${gid}`}
    />
  );
}