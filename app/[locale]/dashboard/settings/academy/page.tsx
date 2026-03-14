import db from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { redirect } from "next/navigation";
import CurrenciesClient from "@/components/dashboard/settings/academy/viewer";

export default async function CurrenciesPage() {
  const token = await getTokenFromCookie();
  if (!token) redirect("/login");
  const payload = verifyToken(token);
  if (!payload) redirect("/login");
  if (payload.role !== 1) redirect("/dashboard"); // only academy admin

  const currencies = await db.currency.findMany({
    where: { academyId: payload.academyId },
    orderBy: { isDefault: "desc" },
  });

  return <CurrenciesClient initialCurrencies={currencies} />;
}
