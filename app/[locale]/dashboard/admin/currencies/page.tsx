import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import CurrenciesClient from "@/components/dashboard/admin/currencies/viewer";

export default async function CurrenciesPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.SuperAdmin) {
    redirect("/login");
  }

  const currencies = await db.currency.findMany({
    orderBy: { code: "asc" },
  });

  return <CurrenciesClient initialCurrencies={currencies} />;
}
