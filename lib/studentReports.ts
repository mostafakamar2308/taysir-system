import db from "@/lib/prisma";
import type { StudentReportItem } from "@/types/studentReport";

export async function getStudentReportItems(
  studentId: number,
  take?: number,
): Promise<StudentReportItem[]> {
  const rows = await db.studentReport.findMany({
    where: { studentId },
    include: {
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    hasFile: !!r.filePath,
    originalFileName: r.originalFileName,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    authorName: r.createdBy.name ?? "مستخدم",
    lastEditorName: r.updatedBy?.name ?? null,
  }));
}