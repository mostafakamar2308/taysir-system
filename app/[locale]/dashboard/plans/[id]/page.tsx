import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import PlanDetailClient from "@/components/dashboard/plans/planDetailViewer";
import { PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;
  const planId = parseInt((await params).id);
  if (isNaN(planId)) notFound();

  const plan = await db.plan.findUnique({
    where: { id: planId, academyId },
    include: {
      currency: true,
      subscriptions: {
        where: { status: SubscriptionStatus.active },
        include: { student: true },
      },
      revenues: {
        where: { status: PaymentStatus.PAID },
      },
    },
  });

  if (!plan) notFound();

  const activeStudents = plan.subscriptions.map((sub) => ({
    id: sub.student.id,
    name: sub.student.name,
    email: sub.student.email,
    phone: sub.student.phone,
    status: sub.student.status,
    startDate: sub.startDate,
    endDate: sub.endDate,
  }));

  const totalRevenue = plan.revenues.reduce((sum, r) => sum + r.amount, 0);

  const currencies = await db.currency.findMany();

  return (
    <PlanDetailClient
      plan={{
        id: plan.id,
        title: plan.title,
        sessionsPerWeek: plan.sessionsPerWeek,
        price: plan.price,
        billingPeriod: plan.billingPeriod,
        currency: plan.currency.name,
      }}
      currencies={currencies}
      activeStudents={activeStudents}
      totalRevenue={totalRevenue}
    />
  );
}
