import { user } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@/types/user";
import { getAcademySettings } from "@/actions/academySettings";
import CurrenciesClient from "@/components/dashboard/settings/currencies/viewer";

export default async function CurrenciesPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Admin || !currentUser.academyId)
    redirect("/login");

  const settingsRes = await getAcademySettings(currentUser.academyId);
  if (!settingsRes.ok) notFound();
  const settings = settingsRes.data;

  return (
    <CurrenciesClient
      initialCurrencies={settings.currencies}
      defaultCurrencyId={settings.defaultCurrencyId}
      academyId={currentUser.academyId}
    />
  );
}
