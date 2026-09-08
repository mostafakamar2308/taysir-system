import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { getTimeExtensionRequests } from "@/actions/timeExtensionRequests";
import type { TimeExtensionRequestItem } from "@/types/timeExtension";
import TimeExtensionRequestsViewer from "@/components/dashboard/timeExtensionRequests/viewer";

export default async function TimeExtensionRequestsPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== Role.Admin && currentUser.role !== Role.SuperAdmin)
    redirect("/login");

  const res = await getTimeExtensionRequests();
  const requests: TimeExtensionRequestItem[] = res.ok ? (res.data ?? []) : [];

  return <TimeExtensionRequestsViewer initialRequests={requests} />;
}