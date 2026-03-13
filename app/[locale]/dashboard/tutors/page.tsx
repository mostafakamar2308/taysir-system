import db from "@/lib/prisma";
import { DashboardTutor } from "@/types/tutor";
import TutorsViewer from "@/components/dashboard/tutors/viewer";
import { dayLabels } from "@/components/dashboard/studentProfile/viewer";

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    speciality?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  // Fetch tutors with related data
  const tutors = await db.tutor.findMany({
    include: {
      user: true,
      specialities: true,
      students: { select: { id: true } }, // for count
      tutorAvailabilities: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const transformed: DashboardTutor[] = tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
    email: t.user.email,
    phone: t.phone ?? "",
    status: t.active ?? false,
    specialities: t.specialities.map((s) => s.title),
    pricePerSession: t.pricePerSession,
    timezone: t.user.timezone,
    createdAt: t.createdAt,
    studentCount: t.students.length,
    timetable: t.tutorAvailabilities.map((a) => ({
      day: dayLabels[a.dayOfWeek] || a.dayOfWeek.toString(),
      from: a.startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      to: a.endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    })),
    zoomAuthenticated: t.zoomAuthenticated,
  }));

  const specialities = await db.speciality.findMany();

  const academyId = 9;

  return (
    <TutorsViewer
      specialities={specialities}
      academyId={academyId}
      tutors={transformed}
    />
  );
}
