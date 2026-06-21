import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  // 1. Authenticate
  const currentUser = await user();
  if (!currentUser) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { type, id } = await params;

  let filePath = "";
  let originalName = "";

  // 2. Fetch file metadata and check authorisation
  if (type === "assignment") {
    const assignment = await db.assignment.findUnique({
      where: { id: parseInt(id) },
      select: {
        filePath: true,
        originalFileName: true,
        session: {
          select: {
            academyId: true,
            tutorId: true,
            participants: { select: { studentId: true } },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "الواجب غير موجود" }, { status: 404 });
    }

    // Authorise: must be same academy
    if (assignment.session.academyId !== currentUser.academyId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const isAdmin = currentUser.role === Role.Admin;
    const isTutor = currentUser.tutorId === assignment.session.tutorId;
    const isParticipant = assignment.session.participants.some(
      (p) => p.studentId === currentUser.studentId,
    );

    if (!isAdmin && !isTutor && !isParticipant) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    filePath = assignment.filePath;
    originalName = assignment.originalFileName;
  } else if (type === "solution") {
    const solution = await db.homeworkSolution.findUnique({
      where: { id: parseInt(id) },
      select: {
        filePath: true,
        originalFileName: true,
        assignment: {
          select: {
            session: {
              select: {
                tutorId: true,
                academyId: true,
                participants: { select: { studentId: true } },
              },
            },
          },
        },
      },
    });

    if (!solution) {
      return NextResponse.json({ error: "الحل غير موجود" }, { status: 404 });
    }

    if (solution.assignment.session.academyId !== currentUser.academyId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const isAdmin = currentUser.role === Role.Admin;
    const isTutor = currentUser.tutorId === solution.assignment.session.tutorId;
    const isOwner = solution.assignment.session.participants.some(
      (p) => p.studentId === currentUser.studentId,
    );

    if (!isAdmin && !isTutor && !isOwner) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    filePath = solution.filePath;
    originalName = solution.originalFileName;
  } else {
    return NextResponse.json(
      { error: "نوع غير صالح (assignment أو solution)" },
      { status: 400 },
    );
  }

  // 3. Stream the file
  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(originalName)}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "الملف غير موجود على الخادم" },
      { status: 404 },
    );
  }
}
