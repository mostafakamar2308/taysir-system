import db from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { redirect } from "next/navigation";
import UserManagementClient from "@/components/dashboard/settings/user/viewer";

export default async function UserManagementPage() {
  const token = await getTokenFromCookie();
  if (!token) redirect("/login");
  const payload = verifyToken(token);
  if (!payload) redirect("/login");
  if (payload.role !== 1) redirect("/ar/dashboard"); // Only academy admin can access

  // Fetch all users in this academy (Supervisors and Tutors)
  const [supervisors, tutors] = await Promise.all([
    db.supervisor.findMany({
      where: { academyId: payload.academyId },
      include: { user: true },
    }),
    db.tutor.findMany({
      where: { academyId: payload.academyId },
      include: { user: true },
    }),
  ]);

  const users = [
    ...supervisors.map((s) => ({
      id: s.user.id,
      name: s.user.name || "",
      email: s.user.email,
      phone: s.user.phone,
      role: 2, // Supervisor
      timezone: s.user.timezone,
      preferredLanguage: s.user.preferredLanguage,
      active: true, // no active flag for supervisor? we can assume true
      createdAt: s.user.createdAt,
    })),
    ...tutors.map((t) => ({
      id: t.user.id,
      name: t.user.name || "",
      email: t.user.email,
      phone: t.user.phone,
      role: 3, // Tutor
      timezone: t.user.timezone,
      preferredLanguage: t.user.preferredLanguage,
      active: t.active ?? true,
      createdAt: t.user.createdAt,
    })),
  ];

  return (
    <UserManagementClient initialUsers={users} academyId={payload.academyId!} />
  );
}
