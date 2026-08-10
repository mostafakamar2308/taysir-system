import { redirect } from "next/navigation";
import { getCurrentSupervisor } from "@/lib/supervisor";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supervisor = await getCurrentSupervisor();
  if (!supervisor) redirect("/login");

  return <div>{children}</div>;
}
