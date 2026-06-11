import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import LeadsClient from "@/components/dashboard/admin/leads/viewer";

export default async function LeadsPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.SuperAdmin) {
    redirect("/login");
  }

  const leads = await db.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      whatsAppMessages: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
  });

  const transformed = leads.map((lead) => ({
    id: lead.id,
    fullName: lead.fullName,
    phone: lead.phone,
    academyName: lead.academyName,
    countryCode: lead.countryCode,
    studentCategory: lead.studentCategory,
    teacherCount: lead.teacherCount,
    currentMethod: lead.currentMethod,
    biggestChallenge: lead.biggestChallenge,
    urgency: lead.urgency,
    qualificationTier: lead.qualificationTier,
    qualificationStatus: lead.qualificationStatus,
    whatsappStatus: lead.whatsAppMessages[0]?.status || null,
    whatsappMessageId: lead.whatsAppMessages[0]?.messageId || null,
    whatsappError: lead.whatsAppMessages[0]?.errorMessage || null,
    createdAt: lead.createdAt.toISOString(),
  }));

  return <LeadsClient initialLeads={transformed} />;
}
