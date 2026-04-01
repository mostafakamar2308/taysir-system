import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@/types/user";
import AcademyProfileClient from "@/components/dashboard/admin/academyProfile/viewer";
import dayjs from "@/lib/dayjs";

export default async function AcademyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.SuperAdmin) {
    redirect("/login");
  }
  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const academy = await db.academy.findUnique({
    where: { id },
    include: {
      admin: { include: { user: true } },
      students: true,
      tutors: true,
      revenues: {
        where: { status: 1 }, // paid only
      },
      expenses: {
        where: { status: 1 }, // paid only
      },
      saasPlan: true,
    },
  });
  if (!academy) notFound();

  const totalRevenue = academy.revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = academy.expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentMonth = dayjs().format("YYYY-MM");
  const monthlyRevenue = academy.revenues
    .filter((r) => r.date.toISOString().slice(0, 7) === currentMonth)
    .reduce((sum, r) => sum + r.amount, 0);
  const monthlyExpenses = academy.expenses
    .filter((e) => e.date.toISOString().slice(0, 7) === currentMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <AcademyProfileClient
      academy={{
        id: academy.id,
        name: academy.name,
        adminName: academy.admin?.user.name || null,
        adminEmail: academy.admin?.user.email || null,
        studentCount: academy.students.length,
        tutorCount: academy.tutors.length,
        totalRevenue,
        totalExpenses,
        monthlyRevenue,
        monthlyExpenses,
        saasPlan: academy.saasPlan
          ? {
              name: academy.saasPlan.name,
              price: academy.saasPlan.egyptianPrice,
              maxStudents: academy.saasPlan.maxStudents,
              maxTutors: academy.saasPlan.maxTutors,
              billingPeriod: academy.saasPlan.billingPeriod,
            }
          : null,
        saasPlanStartDate: academy.saasPlanStartDate,
        saasPlanEndDate: academy.saasPlanEndDate,
      }}
    />
  );
}
