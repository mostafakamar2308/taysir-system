import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPlans } from "@/actions/plan";
import PlansClient from "@/components/dashboard/plans/viewer";

export default async function PlansPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  const academyId = currentUser.academyId!;

  const plans = await getPlans(academyId);
  const currencies = await db.currency.findMany();

  return (
    <PlansClient plans={plans} currencies={currencies} academyId={academyId} />
  );
}
