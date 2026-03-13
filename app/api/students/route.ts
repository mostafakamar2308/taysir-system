import { NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const academyId = searchParams.get("academyId");
  const search = searchParams.get("search") || "";

  if (!academyId) {
    return NextResponse.json(
      { error: "academyId is required" },
      { status: 400 },
    );
  }

  const students = await db.student.findMany({
    where: {
      academyId: parseInt(academyId),
      name: {
        contains: search,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 20,
  });

  return NextResponse.json(students);
}
