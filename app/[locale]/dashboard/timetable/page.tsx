import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { getNextOccurrence } from "@/lib/recurringScheduling";
import TimetableClient, {
  type TimetableItem,
  type GroupOption,
} from "@/components/timetable/timetableClient";

export default async function AdminTimetablePage() {
  const currentUser = await user();
  if (!currentUser?.academyId || currentUser.role !== Role.Admin)
    redirect("/login");
  const academyId = currentUser.academyId;

  const [schedules, groups] = await Promise.all([
    db.recurringSchedule.findMany({
      where: { academyId, active: true },
      include: {
        group: { select: { title: true } },
        tutor: { select: { user: { select: { name: true } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    db.group.findMany({
      where: { academyId, active: true },
      include: {
        currentTutor: {
          select: { id: true, user: { select: { name: true } } },
        },
      },
      orderBy: { title: "asc" },
    }),
  ]);

  const items: TimetableItem[] = schedules.map((s) => ({
    id: s.id,
    groupId: s.groupId,
    groupName: s.group.title,
    tutorId: s.tutorId,
    tutorName: s.tutor.user.name ?? "",
    dayOfWeek: s.dayOfWeek,
    startTime: dayjs.utc(s.startTime).format("HH:mm"),
    durationMinutes: s.durationMinutes,
    topic: s.topic,
    endDate: s.endDate ? dayjs(s.endDate).format("YYYY-MM-DD") : null,
    nextOccurrence: getNextOccurrence(s),
  }));

  const groupOptions: GroupOption[] = groups.map((g) => ({
    id: g.id,
    title: g.title,
    tutorId: g.currentTutor.id,
    tutorName: g.currentTutor.user.name ?? "",
  }));

  return (
    <TimetableClient
      role="admin"
      schedules={items}
      groupOptions={groupOptions}
      canCreate
    />
  );
}