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
  if (!currentUser) redirect("/login");
  const { name } = await searchParams;

  const students = await db.student.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
      academyId: currentUser?.academyId,
    },
    include: {
      tutor: {
        include: {
          user: true,
        },
      },
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const currencies = await db.currency.findMany({
    where: {},
  });
  const plans = await db.plan.findMany({
    where: { academyId: currentUser.academyId },
  });

  const transformedStudents: DashboardStudent[] = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email || "",
    age: student.age,
    phone: student.phone || "",
    country: student.country || "",
    timezone: student.timezone,
    status: student.status,
    startDate: student.startDate,
    renewalDate: student.renewalDate,
    currentProgram: student.currentProgram || undefined,
    tutorName: student.tutor?.user?.name || "غير معين",
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
