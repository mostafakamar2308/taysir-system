import { redirect } from "next/navigation";
import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import type { StudentGroupSummary } from "@/types/student/groups";
import StudentGroupsList from "@/components/dashboard/student/groups/groupsList";

export default async function StudentGroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentUser = await user();
  if (!currentUser || !currentUser.studentId) redirect("/login");

  const studentId = currentUser.studentId;

  const memberships = await db.groupStudent.findMany({
    where: { studentId, active: true },
    include: {
      group: {
        include: {
          currentTutor: { include: { user: { select: { name: true } } } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  const groupIds = memberships.map((m) => m.group.id);

  const participants = await db.sessionParticipant.findMany({
    where: { studentId, session: { groupId: { in: groupIds } } },
    select: {
      session: {
        select: {
          id: true,
          groupId: true,
          startTime: true,
          durationMinutes: true,
          cancelledBy: true,
          topic: true,
        },
      },
      report: { select: { rating: true } },
    },
  });

  const now = dayjs.utc();
  const byGroup = new Map<number, typeof participants>();
  for (const p of participants) {
    const list = byGroup.get(p.session.groupId) ?? [];
    list.push(p);
    byGroup.set(p.session.groupId, list);
  }

  const groups: StudentGroupSummary[] = memberships.map((m) => {
    const group = m.group;
    const groupParticipants = byGroup.get(group.id) ?? [];

    const ratings = groupParticipants
      .map((p) => p.report?.rating)
      .filter((r): r is number => r != null);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    const dated = groupParticipants
      .map((p) => ({
        date: dayjs.utc(p.session.startTime),
        status: getSessionStatus(p.session),
      }))
      .filter((d) => d.status !== 2);

    const futureDates = dated.filter((d) => d.date.isAfter(now)).sort((a, b) => a.date.valueOf() - b.date.valueOf());
    const pastDates = dated
      .filter((d) => d.date.isBefore(now))
      .sort((a, b) => b.date.valueOf() - a.date.valueOf());

    return {
      id: group.id,
      title: group.title,
      tutorName: group.currentTutor.user.name ?? "—",
      isPrivate: group._count.members === 1,
      active: group.active,
      averageRating,
      reportCount: ratings.length,
      nextSessionDate: futureDates[0]?.date.toISOString() ?? null,
      latestSessionDate: pastDates[0]?.date.toISOString() ?? null,
    };
  });

  return (
    <StudentGroupsList
      groups={groups}
      groupsBasePath={`/${locale}/dashboard/student/groups`}
    />
  );
}