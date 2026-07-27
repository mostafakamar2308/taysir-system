import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import GroupsViewer from "@/components/dashboard/groups/viewer";
import type { DashboardGroup } from "@/types/group";
import dayjs from "@/lib/dayjs";

export default async function GroupsPage() {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) redirect("/login");
  const academyId = currentUser.academyId;

  const groups = await db.group.findMany({
    where: { academyId },
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
      // No sessions here – we'll fetch them separately
    },
    orderBy: { title: "asc" },
  });

  // Fetch all session start times for these groups (only startTime + groupId)
  const groupIds = groups.map((g) => g.id);
  const sessions = await db.session.findMany({
    where: { groupId: { in: groupIds } },
    select: { startTime: true, groupId: true },
  });

  // Group session dates by group
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

    // Next session = first future date
    const futureDates = dates.filter((d) => d.valueOf() > now.valueOf());
    const nextSessionDate =
      futureDates.length > 0 ? futureDates[0].toISOString() : null;

    // Latest session = last date that is ≤ now
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

  return <GroupsViewer initialGroups={transformed} academyId={academyId} />;
}
