import db from "@/lib/prisma";
import SupervisorsViewer from "@/components/dashboard/supervisors/viewer";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";

const SupervisorsPage = async () => {
  const currentUser = await user();
  if (!currentUser) redirect("/login");

  const supervisors = await db.supervisor.findMany({
    where: {
      academyId: currentUser.academyId,
    },
    include: {
      user: {
        select: { name: true, email: true, phone: true, timezone: true },
      },
      defaultForTutors: {
        select: { id: true, user: { select: { name: true } }, active: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const tutors = await db.tutor.findMany({
    where: {
      academyId: currentUser.academyId,
    },
    include: {
      user: { select: { name: true, email: true } },
      defaultSupervisor: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const transformed = supervisors.map((s) => ({
    id: s.id,
    name: s.user.name ?? "",
    email: s.user.email,
    phone: s.user.phone ?? "",
    timezone: s.user.timezone,
    active: s.active,
    createdAt: s.createdAt,
    tutors: s.defaultForTutors.map((t) => ({
      id: t.id,
      name: t.user.name ?? "",
      active: !!t.active,
    })),
  }));

  const transformedTutors = tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
    email: t.user.email,
    active: !!t.active,
    supervisorId: t.defaultSupervisor?.id ?? null,
  }));

  return (
    <SupervisorsViewer
      supervisors={transformed}
      tutors={transformedTutors}
      academyId={currentUser.academyId!}
    />
  );
};

export default SupervisorsPage;
