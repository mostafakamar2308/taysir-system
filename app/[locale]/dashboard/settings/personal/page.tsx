import db from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/dashboard/settings/personal/viewer";

export default async function ProfilePage() {
  console.log("Herer");

  const token = await getTokenFromCookie();
  if (!token) redirect("/login");
  const payload = verifyToken(token);
  if (!payload) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      timezone: true,
      preferredLanguage: true,
      role: true,
    },
  });

  if (!user) redirect("/login");

  const transformed = {
    ...user,
    name: user.name || "",
    phone: user.phone || "",
    timezone: user.timezone || "Africa/Cairo",
    preferredLanguage: user.preferredLanguage || "ar",
  };
  console.log("Here");

  return <ProfileClient user={transformed} />;
}
