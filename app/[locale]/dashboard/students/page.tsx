import db from "@/lib/prisma";
import StudentsViewer from "@/components/dashboard/students/viewer";
import { DashboardStudent } from "@/types/student";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) redirect("/login");
  const { name } = await searchParams;

  const students = await db.student.findMany({
    where: {
      user: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
      academyId: currentUser?.academyId,
    },
    include: {
      user: {
        select: { name: true, phone: true, email: true, timezone: true },
      },
      tutor: {
        include: {
          user: true,
        },
      },
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const currencies = await db.currency.findMany({});
  const plans = await db.plan.findMany({
    where: { academyId: currentUser.academyId },
  });

  const transformedStudents: DashboardStudent[] = students.map((student) => ({
    id: student.id,
    name: student.user.name || "",
    email: student.user.email || "",
    age: student.age,
    phone: student.user.phone || "",
    country: student.country || "",
    timezone: student.user.timezone,
    status: student.status,
    tutorName: student.tutor?.user?.name || "لم يحدد معلم",
    tutorId: student.tutor?.id,
    plan: student.plan?.id,
    planName: student.plan?.title,
  }));

  const tutors = await db.tutor.findMany({
    include: { user: true },
    where: { active: true, academyId: currentUser.academyId },
  });
  const tutorOptions = tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
  }));

  return (
    <StudentsViewer
      students={transformedStudents}
      tutors={tutorOptions}
      academyId={currentUser.academyId}
      plans={plans}
      currencies={currencies}
    />
  );
}
