import { notFound, redirect } from "next/navigation";
import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import GroupDetailClient from "@/components/dashboard/groups/groupDetail/viewer";
import { getGroupDetail } from "@/lib/groups";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await user();
  if (!currentUser?.academyId) redirect("/login");
  if (
    currentUser.role !== Role.Admin &&
    currentUser.role !== Role.SuperAdmin
  ) {
    redirect("/ar/dashboard");
  }
  const academyId = currentUser.academyId;

  const groupId = parseInt((await params).id);
  if (isNaN(groupId)) notFound();

  const result = await getGroupDetail({ id: groupId, academyId });
  if (!result) notFound();

  const tutors = (
    await db.tutor.findMany({
      where: { academyId, active: true },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    })
  ).map((t) => ({ id: t.id, name: t.user.name }));

  return <GroupDetailClient group={result.group} tutors={tutors} />;
}