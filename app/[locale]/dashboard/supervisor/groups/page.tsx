import { redirect } from "next/navigation";
import { getCurrentSupervisor } from "@/lib/supervisor";
import { getGroupOverview } from "@/lib/groups";
import ReadOnlyGroupsViewer from "@/components/dashboard/groups/readOnlyGroupsViewer";

export default async function SupervisorGroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supervisor = await getCurrentSupervisor();
  if (!supervisor) redirect("/login");

  const { publicGroups, privateGroups } = await getGroupOverview({
    academyId: supervisor.academyId,
  });

  return (
    <ReadOnlyGroupsViewer
      publicGroups={publicGroups}
      privateGroups={privateGroups}
      detailBase={`/${locale}/dashboard/supervisor/groups`}
    />
  );
}