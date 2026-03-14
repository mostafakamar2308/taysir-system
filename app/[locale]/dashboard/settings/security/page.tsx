import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { redirect } from "next/navigation";
import SecurityClient from "@/components/dashboard/settings/security/viewer";

export default async function SecurityPage() {
  const token = await getTokenFromCookie();
  if (!token) redirect("/login");
  const payload = verifyToken(token);
  if (!payload) redirect("/login");

  return <SecurityClient />;
}
