import { getAcademies } from "@/actions/academy";
import db from "@/lib/prisma";
import AcademiesClient from "@/components/dashboard/admin/academies/viewer";

export default async function AcademiesPage() {
  const academies = await getAcademies();

  // Get all users with potential admin role (or all users) for admin dropdown
  const users = await db.user.findMany({
    where: { role: { in: [1, 3] } }, // Admin or Tutor? Actually we need potential admins: SuperAdmin (0) can't, Admin (1) already admin, others can be promoted. We'll show all non-admin users.
    // For simplicity, get all users and filter in client, or better: get all users not already admin of another academy.
    select: { id: true, name: true, email: true, role: true },
  });

  // Get users who are not already admins of any academy
  const admins = await db.admin.findMany({ select: { userId: true } });
  const adminUserIds = new Set(admins.map((a) => a.userId));
  const availableUsers = users.filter(
    (u) => !adminUserIds.has(u.id) || u.role === 1,
  ); // allow current admins to be selected

  return (
    <AcademiesClient
      initialAcademies={academies}
      users={availableUsers.map((u) => ({ id: u.id, name: u.name || u.email }))}
    />
  );
}
