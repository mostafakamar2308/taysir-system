import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import SaasSubscriptionsClient from "@/components/dashboard/admin/subscriptions/viewer";
import dayjs from "@/lib/dayjs";

export default async function SaasSubscriptionsPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.SuperAdmin) {
    redirect("/login");
  }

  // Fetch all academies with their SaaS plan, admin, and counts of students/tutors
  const academies = await db.academy.findMany({
    include: {
      admin: {
        include: { user: true },
      },
      saasPlan: true,
      _count: {
        select: { students: true, tutors: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform for client
  const transformed = academies.map((a) => ({
    id: a.id,
    name: a.name,
    adminName: a.admin?.user.name || null,
    adminPhone: a.admin?.user.phone || null,
    saasPlanName: a.saasPlan?.name || null,
    saasPlanPrice: a.saasPlan?.egyptianPrice || null,
    saasPlanMaxStudents: a.saasPlan?.maxStudents || null,
    saasPlanMaxTutors: a.saasPlan?.maxTutors || null,
    startDate: a.saasPlanStartDate?.toISOString() || null,
    endDate: a.saasPlanEndDate?.toISOString() || null,
    studentCount: a._count.students,
    tutorCount: a._count.tutors,
  }));

  // Compute summary stats
  const plans = await db.saasPlan.findMany();
  const planStats = plans.map((plan) => {
    const academiesOnPlan = academies.filter((a) => a.saasPlanId === plan.id);
    const activeCount = academiesOnPlan.filter(
      (a) => a.saasPlanEndDate && dayjs(a.saasPlanEndDate).isAfter(dayjs()),
    ).length;
    const totalRevenue = academiesOnPlan.reduce(
      (sum) => sum + (plan.egyptianPrice || 0),
      0,
    );
    return {
      id: plan.id,
      name: plan.name,
      price: plan.egyptianPrice,
      academiesCount: academiesOnPlan.length,
      activeCount,
      totalRevenue,
    };
  });

  // Total MRR from active paid plans (non-free)
  const mrr = academies.reduce((sum, a) => {
    if (
      a.saasPlan &&
      a.saasPlan.egyptianPrice > 0 &&
      a.saasPlanEndDate &&
      dayjs(a.saasPlanEndDate).isAfter(dayjs())
    ) {
      return sum + a.saasPlan.egyptianPrice;
    }
    return sum;
  }, 0);

  // Academies near end (within 7 days)
  const nearEnd = transformed.filter((a) => {
    if (!a.endDate) return false;
    const daysLeft = dayjs(a.endDate).diff(dayjs(), "day");
    return daysLeft >= 0 && daysLeft <= 7;
  });

  // Expired academies
  const expired = transformed.filter((a) => {
    if (!a.endDate) return false;
    return dayjs(a.endDate).isBefore(dayjs());
  });

  return (
    <SaasSubscriptionsClient
      academies={transformed}
      planStats={planStats}
      mrr={mrr}
      nearEnd={nearEnd}
      expired={expired}
    />
  );
}
