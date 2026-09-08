import { notFound, redirect } from "next/navigation";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import { getGroupDetail } from "@/lib/groups";
import GroupDetailClient from "@/components/dashboard/groups/groupDetail/viewer";

export default async function TutorGroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const groupId = parseInt(id);
  if (isNaN(groupId)) notFound();

  const currentUser = await user();
  if (
    !currentUser ||
    currentUser.role !== Role.Tutor ||
    !currentUser.tutorId ||
    !currentUser.academyId
  ) {
    redirect("/login");
  }

  const result = await getGroupDetail(
    {
      id: groupId,
      academyId: currentUser.academyId,
      currentTutorId: currentUser.tutorId,
    },
    { readOnly: true },
  );

  if (!result) notFound();

  return (
    <GroupDetailClient
      group={result.group}
      readOnly
      backHref={`/${locale}/dashboard/tutor/groups`}
    />
  );
}