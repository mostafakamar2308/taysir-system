import db from "@/lib/prisma";
import StudentsViewer from "@/components/dashboard/students/viewer";
import { DashboardStudent } from "@/types/student";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;

  const students = await db.student.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
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

  const plans = await db.plan.findMany();

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
    tutorName: student.tutor?.user?.name || "غير معين",
    plan: student.plan?.id,
  }));

  return <StudentsViewer students={transformedStudents} plans={plans} />;
}
