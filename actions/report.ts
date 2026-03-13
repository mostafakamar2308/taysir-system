"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function generateReport(formData: FormData) {
  const type = formData.get("type") as string;
  const month = formData.get("month") as string;
  const academyId = parseInt(formData.get("academyId") as string);

  // Validate
  if (!type || !month) throw new Error("Missing fields");

  // Determine title based on type and month
  const monthName = new Date(month + "-01").toLocaleDateString("ar-EG", {
    month: "long",
    year: "numeric",
  });
  const titles: Record<string, string> = {
    student_progress: `تقرير تقدم الطلاب - ${monthName}`,
    tutor_performance: `تقرير أداء المعلمين - ${monthName}`,
    financial: `تقرير مالي - ${monthName}`,
  };
  const title = titles[type] || `تقرير ${monthName}`;

  // In a real app, you'd generate the file here (e.g., using a library like PDFKit)
  // For now, we'll just create a database record with a placeholder fileUrl
  const fileUrl = null; // or generate a fake URL

  const report = await db.report.create({
    data: {
      title,
      type,
      month,
      fileUrl,
      academyId,
      // createdBy: (await getCurrentUser()).id // if you have user session
    },
  });

  revalidatePath("/dashboard/analytics/reports");
  return report;
}

export async function getReports(academyId: number) {
  return db.report.findMany({
    where: { academyId },
    orderBy: { generatedAt: "desc" },
  });
}
