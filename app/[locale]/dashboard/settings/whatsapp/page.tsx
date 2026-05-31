import { BulkMessagePanel } from "@/components/dashboard/whatsapp/bulkMessagePanel";
import { WhatsAppConnect } from "@/components/dashboard/whatsapp/whatsappConnect";
import { user } from "@/lib/auth";
import db from "@/lib/prisma";
import { Role } from "@/types/user";
import { redirect } from "next/navigation";

export default async function Page() {
  const currentUser = await user();
  if (
    !currentUser ||
    currentUser.role !== Role.Admin ||
    !currentUser.academyId
  ) {
    redirect("/login");
  }

  const academyId = currentUser.academyId;

  const [students, tutors] = await Promise.all([
    db.student.findMany({
      where: { academyId },
      select: { id: true, user: { select: { name: true, phone: true } } },
    }),
    db.tutor.findMany({
      where: { academyId },
      select: { id: true, user: { select: { name: true, phone: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <WhatsAppConnect />
      <BulkMessagePanel
        students={students.map((t) => ({
          id: t.id,
          name: t.user.name,
          phone: t.user.phone,
        }))}
        tutors={tutors.map((t) => ({
          id: t.id,
          name: t.user.name,
          phone: t.user.phone,
        }))}
      />
    </div>
  );
}
