import { notFound, redirect } from "next/navigation";
import { getCurrentSupervisor } from "@/lib/supervisor";
import { getGroupDetail } from "@/lib/groups";
import GroupDetailClient from "@/components/dashboard/groups/groupDetail/viewer";

export default async function SupervisorGroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const groupId = parseInt(id);
  if (isNaN(groupId)) notFound();

  const supervisor = await getCurrentSupervisor();
  if (!supervisor) redirect("/login");

  const result = await getGroupDetail(
    {
      id: groupId,
      academyId: supervisor.academyId,
    },
    { readOnly: true },
  );

  if (!result) notFound();

  return (
    <GroupDetailClient
      group={result.group}
      readOnly
      backHref={`/${locale}/dashboard/supervisor/groups`}
    />
  );
}