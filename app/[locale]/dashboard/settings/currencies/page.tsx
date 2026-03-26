import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { getAcademySettings } from "@/actions/academySettings";
import CurrenciesClient from "@/components/dashboard/settings/currencies/viewer";

export default async function CurrenciesPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Admin || !currentUser.academyId)
    redirect("/login");

  const settings = await getAcademySettings(currentUser.academyId);

  return (
    <CurrenciesClient
      initialCurrencies={settings.currencies}
      defaultCurrencyId={settings.defaultCurrencyId}
      academyId={currentUser.academyId}
    />
  );
}
