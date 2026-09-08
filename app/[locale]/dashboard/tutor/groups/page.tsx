import { redirect } from "next/navigation";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import { getGroupOverview } from "@/lib/groups";
import ReadOnlyGroupsViewer from "@/components/dashboard/groups/readOnlyGroupsViewer";

export default async function TutorGroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const currentUser = await user();
  if (
    !currentUser ||
    currentUser.role !== Role.Tutor ||
    !currentUser.tutorId ||
    !currentUser.academyId
  ) {
    redirect("/login");
  }

  const { publicGroups, privateGroups } = await getGroupOverview({
    academyId: currentUser.academyId,
    currentTutorId: currentUser.tutorId,
  });

  return (
    <ReadOnlyGroupsViewer
      publicGroups={publicGroups}
      privateGroups={privateGroups}
      detailBase={`/${locale}/dashboard/tutor/groups`}
    />
  );
}