import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getPlans } from "@/actions/plan";
import PlansClient from "@/components/dashboard/plans/viewer";

export default async function PlansPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;

  const plansRes = await getPlans(academyId);
  if (!plansRes.ok) notFound();
  const currencies = await db.currency.findMany();

  return (
    <PlansClient plans={plansRes.data} currencies={currencies} academyId={academyId} />
  );
}
