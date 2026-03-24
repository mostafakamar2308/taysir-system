import db from "@/lib/prisma";
import { DashboardTutor } from "@/types/tutor";
import TutorsViewer from "@/components/dashboard/tutors/viewer";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { dayLabels } from "@/lib/enums";

const TutorsPage = async () => {
  const currentUser = await user();
  if (!currentUser) redirect("/login");

  const tutors = await db.tutor.findMany({
    where: {
      academyId: currentUser.academyId,
    },
    include: {
      user: true,
      specialities: true,
      students: { select: { id: true } },
      tutorAvailabilities: true,
      currency: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const currencies = await db.currency.findMany({
    where: {},
  });

  const transformed: DashboardTutor[] = tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
    email: t.user.email,
    phone: t.user.phone ?? "",
    status: t.active ?? false,
    specialities: t.specialities.map((s) => s.title),
    pricePerSession: t.pricePerSession,
    timezone: t.user.timezone,
    createdAt: t.createdAt,
    currency: t.currency.name,
    studentCount: t.students.length,
    active: !!t.active,
    bio: t.bio || "",
    qualifications: t.qualifications || "",
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

  return (
    <TutorsViewer
      specialities={specialities}
      academyId={currentUser.academyId!}
      currencies={currencies}
      tutors={transformed}
    />
  );
};

export default TutorsPage;
