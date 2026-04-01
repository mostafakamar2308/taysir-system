import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import AcademiesClient from "@/components/dashboard/admin/academies/viewer";
import { PaymentStatus } from "@/types/payment";

export default async function AcademiesPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.SuperAdmin) {
    redirect("/login");
  }

  const academies = await db.academy.findMany({
    include: {
      admin: {
        include: { user: true },
      },
      students: true,
      tutors: true,
      revenues: {
        where: { status: PaymentStatus.PAID },
      },
      expenses: {
        where: { status: PaymentStatus.PAID },
      },
      saasPlan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform data for client
  const transformed = academies.map((a) => ({
    id: a.id,
    name: a.name,
    adminId: a.admin?.userId || null,
    adminName: a.admin?.user.name || null,
    adminEmail: a.admin?.user.email || null,
    studentCount: a.students.length,
    tutorCount: a.tutors.length,
    totalRevenue: a.revenues.reduce((sum, r) => sum + r.amount, 0),
    totalExpenses: a.expenses.reduce((sum, e) => sum + e.amount, 0),
    saasPlanName: a.saasPlan?.name || null,
    saasPlanDollarPrice: a.saasPlan?.dollarPrice || null,
    saasPlanEgyptianPrice: a.saasPlan?.egyptianPrice || null,
    createdAt: a.createdAt,
  }));

  const saasPlans = await db.saasPlan.findMany();

  return <AcademiesClient academies={transformed} saasPlans={saasPlans} />;
}
