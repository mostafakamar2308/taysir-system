import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/prisma";
import ZoomSettingsPage from "@/components/dashboard/zoom/viewer";

export default async function ZoomPage() {
  const currentUser = await user();
  if (!currentUser || !currentUser.tutorId) redirect("/login");

  const tutor = await db.tutor.findUnique({
    where: { id: currentUser.tutorId },
    select: { zoomAuthenticated: true, zoomUrl: true },
  });

  return (
    <ZoomSettingsPage
      isConnected={tutor?.zoomAuthenticated ?? false}
      currentZoomUrl={tutor?.zoomUrl ?? null}
    />
  );
}
