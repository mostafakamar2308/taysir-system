import { redirect } from "next/navigation";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import GroupsViewer from "@/components/dashboard/groups/viewer";
import { getGroupOverview } from "@/lib/groups";

export default async function GroupsPage() {
  const currentUser = await user();
  if (!currentUser?.academyId) redirect("/login");
  if (
    currentUser.role !== Role.Admin &&
    currentUser.role !== Role.SuperAdmin
  ) {
    redirect("/ar/dashboard");
  }
  const academyId = currentUser.academyId;

  // Public groups only (1-on-1/private groups are hidden from the admin list)
  const { publicGroups } = await getGroupOverview({ academyId });

  return <GroupsViewer initialGroups={publicGroups} academyId={academyId} />;
}