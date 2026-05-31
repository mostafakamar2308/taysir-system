import db from "@/lib/prisma";
import { getWeekDates } from "@/lib/dates";
import SessionViewer from "@/components/dashboard/sessions/viewer";
import { getSessionsForWeek } from "@/actions/sessions";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;

  const { week } = await searchParams;
  // If week param is provided (e.g., ?week=2025-03-10), use that date; otherwise today
  const refDate = week ? new Date(week) : new Date();
  const weekDates = getWeekDates(refDate);
  const startOfWeek = weekDates[0];
  const endOfWeek = weekDates[6];
  endOfWeek.setDate(endOfWeek.getDate() + 1); // next day for exclusive end

  const sessions = await getSessionsForWeek(startOfWeek, endOfWeek);

  // Fetch all students and tutors for dropdowns
  const students = await db.student.findMany({
    where: { academyId },
    select: { id: true, user: { select: { name: true } }, tutorId: true },
  });
  const tutors = await db.tutor.findMany({
    where: { academyId },
    include: { user: { select: { name: true } } },
  });
  const tutorOptions = tutors.map((t) => ({ id: t.id, name: t.user.name }));

  return (
    <SessionViewer
      initialSessions={sessions}
      initialWeekStart={weekDates[0].toISOString()}
      students={students.map((s) => ({ ...s, name: s.user.name || "" }))}
      tutors={tutorOptions}
      academyId={academyId}
    />
  );
}
