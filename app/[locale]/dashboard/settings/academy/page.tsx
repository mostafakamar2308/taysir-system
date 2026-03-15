import db from "@/lib/prisma";
import { redirect } from "next/navigation";
import CurrenciesClient from "@/components/dashboard/settings/academy/viewer";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";

export default async function CurrenciesPage() {
  const currentUser = await user();
  if (currentUser?.role !== Role.Admin) redirect("/dashboard"); // only academy admin

  const currencies = await db.currency.findMany({
    where: { academyId: currentUser.academyId },
    orderBy: { isDefault: "desc" },
  });

  return <CurrenciesClient initialCurrencies={currencies} />;
}
