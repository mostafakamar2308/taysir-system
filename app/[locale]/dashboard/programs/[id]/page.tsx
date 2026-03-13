import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProgramDetailClient from "@/components/dashboard/programDetails/viewer";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseInt((await params).id);
  if (isNaN(id)) notFound();

  const program = await db.program.findUnique({
    where: { id },
    include: {
      topics: { orderBy: { order: "asc" } },
      enrollments: {
        include: {
          student: { select: { id: true, name: true } },
          topics: { include: { topic: true } },
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!program) notFound();

  // Transform dates to strings for client
  const transformed = {
    ...program,
    createdAt: program.createdAt,
    topics: program.topics.map((t) => ({
      ...t,
      createdAt: t.createdAt,
    })),
    enrollments: program.enrollments.map((e) => ({
      ...e,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt ?? null,
      topics: e.topics.map((p) => ({
        ...p,
        completedAt: p.completedAt ?? null,
      })),
    })),
  };

  return <ProgramDetailClient program={transformed} />;
}
