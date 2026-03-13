import db from "@/lib/prisma";
import ReportsClient from "@/components/dashboard/reports/viewer";
import { notFound } from "next/navigation";

export default async function ReportsPage() {
  const academy = await db.academy.findFirst();
  if (!academy) notFound();
  const academyId = academy.id;

  const reports = await db.report.findMany({
    where: { academyId },
    orderBy: { generatedAt: "desc" },
  });

  const transformed = reports.map((r) => ({
    ...r,
    generatedAt: r.generatedAt.toISOString(),
  }));

  return <ReportsClient initialReports={transformed} academyId={academyId} />;
}
