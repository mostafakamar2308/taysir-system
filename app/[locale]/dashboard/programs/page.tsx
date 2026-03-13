import db from "@/lib/prisma";
import ProgramsClient from "@/components/dashboard/programs/viewer";
import { notFound } from "next/navigation";

export default async function ProgramsPage() {
  const academy = await db.academy.findFirst({});
  if (!academy) notFound();
  const academyId = academy.id!;

  const programs = await db.program.findMany({
    where: { academyId },
    include: {
      topics: true,
      enrollments: {
        where: { status: 0 }, // active enrollments
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const transformed = programs.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    level: p.level,
    duration: p.duration,
    academyId: p.academyId,
    createdAt: p.createdAt.toISOString().split("T")[0],
    topics: p.topics,
    enrollmentCount: p.enrollments.length,
  }));

  return <ProgramsClient programs={transformed} academyId={academyId} />;
}
